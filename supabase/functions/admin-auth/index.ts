/**
 * admin-auth — Admin authentication endpoint
 *
 * Actions (via request body `action` field):
 *   login         POST { action: "login", email, password }
 *                 -> Authenticates against Supabase Auth, verifies admin role,
 *                    returns { token, refresh_token, expires_at, user }
 *
 *   refresh       POST { action: "refresh", refresh_token }
 *                 -> Exchanges a refresh token for a new access token
 *
 *   validate      POST { action: "validate" } (Authorization: Bearer <token>)
 *                 -> Checks if the token is valid and the user is still an admin.
 *                    Returns { valid: true, user } or 401/403.
 *
 * Security model:
 *   - Admin = Supabase Auth user with app_metadata.role === "admin"
 *   - app_metadata is ONLY writable via the service role key (tamper-proof)
 *   - No custom JWT system -- the returned token IS the Supabase access_token
 *
 * To create an admin user:
 *   Supabase Dashboard -> Authentication -> Users -> select user
 *   -> Edit -> Raw App Meta Data -> set { "role": "admin" } -> Save
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders, errorResponse, successResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  try {
    const body = await req.json();
    const { action } = body;

    if (!action) return errorResponse("Missing action field", 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey    = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // ACTION: login
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

      // Verify the logged-in user has the admin role
      const isAdmin = data.user.app_metadata?.role === "admin";
      if (!isAdmin) {
        console.warn(`[admin-auth] Non-admin login attempt by user ${data.user.id}`);
        return errorResponse("Forbidden: admin role required", 403);
      }

      console.log(`[admin-auth] Admin login successful: ${data.user.id}`);

      return successResponse({
        token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email,
        },
      });
    }

    // ACTION: refresh
    if (action === "refresh") {
      const { refresh_token } = body;
      if (!refresh_token) return errorResponse("refresh_token is required", 400);

      const supabase = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data, error } = await supabase.auth.refreshSession({ refresh_token });
      if (error || !data.session) {
        return errorResponse("Session refresh failed -- please log in again", 401);
      }

      // Re-verify admin role on refresh (role may have been revoked)
      const isAdmin = data.user?.app_metadata?.role === "admin";
      if (!isAdmin) return errorResponse("Forbidden: admin role required", 403);

      return successResponse({
        token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      });
    }

    // ACTION: validate
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

      return successResponse({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
        },
      });
    }

    return errorResponse(`Unknown action: ${action}`, 400);

  } catch (error: any) {
    console.error("[admin-auth] Unexpected error:", error?.message ?? error);
    return errorResponse(error?.message || "Internal server error", 500);
  }
});
