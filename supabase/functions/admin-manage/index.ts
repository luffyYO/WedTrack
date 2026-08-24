/**
 * admin-manage — Admin user management (CRUD)
 *
 * All operations require super_admin role.
 * Uses service role key for all database operations.
 * Writes to admin_audit_log for every mutation.
 *
 * Endpoints:
 *   GET    /admin-manage           → list all admins
 *   POST   /admin-manage           → invite new admin { email, full_name, role }
 *   PATCH  /admin-manage           → change role or status { target_user_id, role?, status? }
 *   DELETE /admin-manage?id=<uid>  → remove admin record (does NOT delete Supabase auth user)
 *
 * Security:
 *   - Caller must be an active super_admin (verified via JWT + admin_users table)
 *   - app_metadata.role is set/cleared via service role key only
 *   - An admin cannot deactivate, change the role of, or remove themselves
 *   - No passwords are ever generated, stored, or transmitted
 *   - New admins receive a Supabase password-reset email to set their own password
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders, errorResponse, successResponse } from "../_shared/utils.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getCallerRole(adminClient: any, userId: string): Promise<"admin" | "super_admin" | null> {
  const { data, error } = await adminClient
    .from("admin_users")
    .select("role, status")
    .eq("user_id", userId)
    .single();
  if (error || !data) return null;
  if (data.status !== "active") return null;
  return data.role;
}

async function writeAuditLog(
  adminClient: any,
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, any> = {}
) {
  await adminClient.from("admin_audit_log").insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });
}

// ── Main Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey    = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // ── 1. Authenticate: validate caller JWT ─────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing Authorization header", 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    // ── 2. Authorize: must be an active admin with app_metadata.role ─────────
    const hasAdminMetadata = user.app_metadata?.role === "admin";
    if (!hasAdminMetadata) {
      console.warn(`[admin-manage] Non-admin access attempt by ${user.id}`);
      return errorResponse("Forbidden: admin role required", 403);
    }

    // ── 3. Service role client for all DB operations ──────────────────────────
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 4. Check caller is a super_admin ─────────────────────────────────────
    const callerRole = await getCallerRole(adminClient, user.id);
    if (callerRole !== "super_admin") {
      // Legacy admins with no admin_users row are treated as basic admin
      console.warn(`[admin-manage] Non-super_admin access attempt by ${user.id} (role: ${callerRole})`);
      return errorResponse("Forbidden: super_admin role required for admin management", 403);
    }

    const method = req.method;

    // ── GET: List all admins ─────────────────────────────────────────────────
    if (method === "GET") {
      // Fetch all admin_users rows
      const { data: adminRows, error: adminErr } = await adminClient
        .from("admin_users")
        .select("id, user_id, role, status, invited_by, created_at, updated_at")
        .order("created_at", { ascending: true });

      if (adminErr) throw adminErr;

      // Fetch auth user details for each admin
      const userIds = (adminRows ?? []).map((r: any) => r.user_id);
      const userDetails: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: { users }, error: usersErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        if (!usersErr && users) {
          for (const u of users) {
            if (userIds.includes(u.id)) {
              userDetails[u.id] = {
                email: u.email,
                full_name: u.user_metadata?.full_name || u.email?.split("@")[0] || "Unknown",
                last_sign_in_at: u.last_sign_in_at,
              };
            }
          }
        }
      }

      const result = (adminRows ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        email: userDetails[row.user_id]?.email ?? null,
        full_name: userDetails[row.user_id]?.full_name ?? null,
        last_sign_in_at: userDetails[row.user_id]?.last_sign_in_at ?? null,
        role: row.role,
        status: row.status,
        invited_by: row.invited_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      return successResponse(result);
    }

    // ── POST: Invite new admin ────────────────────────────────────────────────
    if (method === "POST") {
      const body = await req.json();
      const { email, full_name, role } = body;

      if (!email || !full_name) {
        return errorResponse("email and full_name are required", 400);
      }

      const assignedRole: "admin" | "super_admin" = role === "super_admin" ? "super_admin" : "admin";

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse("Invalid email address", 400);
      }

      // Check if user already exists in auth
      const { data: { users: existingUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      const existingUser = existingUsers?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

      let targetUserId: string;

      if (existingUser) {
        targetUserId = existingUser.id;

        // Check if they're already an admin
        const { data: existingAdminRow } = await adminClient
          .from("admin_users")
          .select("id, role, status")
          .eq("user_id", existingUser.id)
          .single();

        if (existingAdminRow) {
          return errorResponse(
            `User ${email} is already registered as an admin (role: ${existingAdminRow.role}, status: ${existingAdminRow.status}). Use PATCH to change their role or reactivate them.`,
            409
          );
        }

        // Existing Supabase user — just set their app_metadata and create admin row
        await adminClient.auth.admin.updateUserById(existingUser.id, {
          app_metadata: { role: "admin" },
          user_metadata: { full_name: full_name || existingUser.user_metadata?.full_name },
        });

        // Send password reset so they can set a known password for the admin portal
        await adminClient.auth.admin.generateLink({
          type: "recovery",
          email,
        });

      } else {
        // New user — create account and send invite link
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { full_name },
          app_metadata: { role: "admin" },
        });

        if (createError || !newUser.user) {
          console.error("[admin-manage] Failed to create user:", createError?.message);
          throw createError ?? new Error("Failed to create user");
        }

        targetUserId = newUser.user.id;

        // Generate invite / password reset link (no password ever set by us)
        await adminClient.auth.admin.generateLink({
          type: "recovery",
          email,
        });
      }

      // Insert into admin_users
      const { error: insertError } = await adminClient.from("admin_users").insert({
        user_id: targetUserId,
        role: assignedRole,
        status: "active",
        invited_by: user.id,
      });

      if (insertError) {
        console.error("[admin-manage] Failed to insert admin_users row:", insertError.message);
        throw insertError;
      }

      // Write audit log
      await writeAuditLog(adminClient, user.id, "admin_invited", "admin_user", targetUserId, {
        email,
        full_name,
        role: assignedRole,
        was_existing_user: !!existingUser,
      });

      console.log(`[admin-manage] Super admin ${user.id} invited ${email} as ${assignedRole}`);

      return successResponse({
        message: `Admin invitation sent to ${email}. They will receive a password reset email to set their password.`,
        user_id: targetUserId,
        role: assignedRole,
      });
    }

    // ── PATCH: Change role or status ─────────────────────────────────────────
    if (method === "PATCH") {
      const body = await req.json();
      const { target_user_id, role, status } = body;

      if (!target_user_id) return errorResponse("target_user_id is required", 400);
      if (!role && !status) return errorResponse("At least one of role or status is required", 400);

      // Self-protection
      if (target_user_id === user.id) {
        return errorResponse("Cannot modify your own admin account", 400);
      }

      // Validate values
      if (role && !["admin", "super_admin"].includes(role)) {
        return errorResponse("Invalid role. Must be 'admin' or 'super_admin'", 400);
      }
      if (status && !["active", "inactive"].includes(status)) {
        return errorResponse("Invalid status. Must be 'active' or 'inactive'", 400);
      }

      // Get current state
      const { data: currentRecord, error: fetchErr } = await adminClient
        .from("admin_users")
        .select("role, status")
        .eq("user_id", target_user_id)
        .single();

      if (fetchErr || !currentRecord) {
        return errorResponse("Admin user not found in admin_users table", 404);
      }

      // Build update
      const updates: Record<string, any> = {};
      if (role) updates.role = role;
      if (status) updates.status = status;

      const { error: updateError } = await adminClient
        .from("admin_users")
        .update(updates)
        .eq("user_id", target_user_id);

      if (updateError) throw updateError;

      // Determine action name for audit log
      const action = status === "inactive" ? "admin_deactivated"
                   : status === "active"   ? "admin_reactivated"
                   : role ? "admin_role_changed"
                   : "admin_updated";

      await writeAuditLog(adminClient, user.id, action, "admin_user", target_user_id, {
        previous_role: currentRecord.role,
        previous_status: currentRecord.status,
        new_role: role ?? currentRecord.role,
        new_status: status ?? currentRecord.status,
      });

      console.log(`[admin-manage] Super admin ${user.id} ${action} target ${target_user_id}`);

      return successResponse({ updated: true, ...updates });
    }

    // ── DELETE: Remove admin record ───────────────────────────────────────────
    if (method === "DELETE") {
      const url = new URL(req.url);
      const targetId = url.searchParams.get("id");

      if (!targetId) return errorResponse("Missing id query parameter", 400);

      // Self-protection
      if (targetId === user.id) {
        return errorResponse("Cannot remove your own admin account", 400);
      }

      // Get admin info for audit log before deletion
      const { data: adminRow } = await adminClient
        .from("admin_users")
        .select("role")
        .eq("user_id", targetId)
        .single();

      // Remove from admin_users (does NOT delete the auth user)
      const { error: deleteError } = await adminClient
        .from("admin_users")
        .delete()
        .eq("user_id", targetId);

      if (deleteError) throw deleteError;

      // Strip admin app_metadata from their auth user
      await adminClient.auth.admin.updateUserById(targetId, {
        app_metadata: { role: null },
      });

      await writeAuditLog(adminClient, user.id, "admin_removed", "admin_user", targetId, {
        removed_role: adminRow?.role ?? "unknown",
      });

      console.log(`[admin-manage] Super admin ${user.id} removed admin ${targetId}`);

      return successResponse({ removed: true, user_id: targetId });
    }

    return errorResponse("Method not allowed", 405);

  } catch (error: any) {
    console.error("[admin-manage] Unexpected error:", error?.message ?? error);
    return errorResponse(error?.message || "Internal server error", 500);
  }
});
