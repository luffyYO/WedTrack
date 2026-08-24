/**
 * admin-auth — Admin authentication endpoint
 *
 * Actions (via request body `action` field):
 *   login         POST { action: "login", email, password }
 *                 → Authenticates against Supabase Auth, verifies admin role,
 *                   checks admin_users.status === 'active',
 *                   returns { token, refresh_token, expires_at, user, role }
 *
 *   refresh       POST { action: "refresh", refresh_token }
 *                 → Exchanges a refresh token for a new access token.
 *                   Re-checks admin role and active status on every refresh.
 *
 *   validate      POST { action: "validate" } (Authorization: Bearer <token>)
 *                 → Checks if the token is valid and the user is still an
 *                   active admin. Returns { valid: true, user, role } or 401/403.
 *
 * Security model:
 *   - Admin = Supabase Auth user with app_metadata.role === "admin"
 *   - app_metadata is ONLY writable via the service role key (tamper-proof)
 *   - Active status is additionally checked in admin_users table
 *   - No custom JWT system — the returned token IS the Supabase access_token
 *   - Deactivated admins are blocked even if their app_metadata.role is still set
 *
 * To create an admin user:
 *   Use the admin-manage edge function with action "invite"
 *   (requires super_admin role)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders, errorResponse, successResponse } from "../_shared/utils.ts";

// Helper: lookup admin_users row for a given Supabase user ID
async function getAdminRecord(adminClient: any, userId: string) {
  const { data, error } = await adminClient
    .from("admin_users")
    .select("role, status")
    .eq("user_id", userId)
    .single();
  if (error || !data) return null;
  return data as { role: "admin" | "super_admin"; status: "active" | "inactive" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  try {
    const body = await req.json();
    const { action } = body;

    if (!action) return errorResponse("Missing action field", 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey    = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Service-role client for admin_users table lookups and audit logging
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── ACTION: login ────────────────────────────────────────────────────────
    if (action === "login") {
      const { email, password } = body;
      if (!email || !password) return errorResponse("email and password are required", 400);

      const supabase = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        console.warn(`[admin-auth] Login failed for ${email}: ${error?.message}`);
        return errorResponse("Invalid credentials", 401);
      }

      // 1. Verify app_metadata.role === "admin" (tamper-proof — service role only writable)
      const hasAdminMetadata = data.user.app_metadata?.role === "admin";
      if (!hasAdminMetadata) {
        console.warn(`[admin-auth] Non-admin login attempt by user ${data.user.id}`);
        return errorResponse("Forbidden: admin role required", 403);
      }

      // 2. Check admin_users table for active status + fetch role
      const adminRecord = await getAdminRecord(adminClient, data.user.id);
      if (!adminRecord) {
        // app_metadata says admin but no admin_users row → possible legacy admin
        // Allow login but treat as basic admin (backwards compat)
        console.warn(`[admin-auth] Admin ${data.user.id} has no admin_users record — treating as legacy admin`);
        return successResponse({
          token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          user: {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.email,
          },
          role: "admin",
        });
      }

      if (adminRecord.status !== "active") {
        console.warn(`[admin-auth] Deactivated admin login attempt by ${data.user.id}`);
        return errorResponse("Forbidden: your admin account has been deactivated", 403);
      }

      console.log(`[admin-auth] Admin login successful: ${data.user.id} (${adminRecord.role})`);

      // Write audit log
      await adminClient.from("admin_audit_log").insert({
        actor_id: data.user.id,
        action: "admin_login",
        target_type: "admin_user",
        target_id: data.user.id,
        metadata: { email: data.user.email, role: adminRecord.role },
      });

      return successResponse({
        token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email,
        },
        role: adminRecord.role,
      });
    }

    // ── ACTION: refresh ──────────────────────────────────────────────────────
    if (action === "refresh") {
      const { refresh_token } = body;
      if (!refresh_token) return errorResponse("refresh_token is required", 400);

      const supabase = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data, error } = await supabase.auth.refreshSession({ refresh_token });
      if (error || !data.session) {
        return errorResponse("Session refresh failed — please log in again", 401);
      }

      // Re-verify admin role on refresh (role may have been revoked)
      const isAdmin = data.user?.app_metadata?.role === "admin";
      if (!isAdmin) return errorResponse("Forbidden: admin role required", 403);

      // Re-check active status on every refresh
      const adminRecord = await getAdminRecord(adminClient, data.user!.id);
      if (adminRecord && adminRecord.status !== "active") {
        return errorResponse("Forbidden: your admin account has been deactivated", 403);
      }

      return successResponse({
        token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        role: adminRecord?.role ?? "admin",
      });
    }

    // ── ACTION: validate ─────────────────────────────────────────────────────
    if (action === "validate") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return errorResponse("Missing Authorization header", 401);

      const supabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return errorResponse("Invalid or expired token", 401);

      const isAdmin = user.app_metadata?.role === "admin";
      if (!isAdmin) return errorResponse("Forbidden: admin role required", 403);

      // Check active status
      const adminRecord = await getAdminRecord(adminClient, user.id);
      if (adminRecord && adminRecord.status !== "active") {
        return errorResponse("Forbidden: your admin account has been deactivated", 403);
      }

      return successResponse({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
        },
        role: adminRecord?.role ?? "admin",
      });
    }

    return errorResponse(`Unknown action: ${action}`, 400);

  } catch (error: any) {
    console.error("[admin-auth] Unexpected error:", error?.message ?? error);
    return errorResponse(error?.message || "Internal server error", 500);
  }
});
