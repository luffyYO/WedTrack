import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders, errorResponse, successResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 1. Authenticate: validate the caller's JWT ──────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing Authorization header", 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    // ── 2. Authorize: verify the caller has the admin role ───────────────────
    // app_metadata is ONLY writable by the service role key — users cannot
    // set it themselves via supabase.auth.updateUser(). This makes it
    // tamper-proof as an authorization flag.
    const isAdmin = user.app_metadata?.role === "admin";
    if (!isAdmin) {
      console.warn(`[admin-users] Access denied for user ${user.id} — not an admin`);
      return errorResponse("Forbidden: admin role required", 403);
    }

    const method = req.method;

    // --- GET: List Users ---
    if (method === "GET") {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;

      // Aggregate wedding counts per user. Only count paid weddings.
      // Falls back gracefully to zero counts on query failure.
      const { data: counts, error: countError } = await supabaseAdmin
        .from("weddings")
        .select("user_id")
        .eq("payment_status", "paid");

      const weddingCounts: Record<string, number> = {};
      if (!countError && counts) {
        for (const row of counts) {
          weddingCounts[row.user_id] = (weddingCounts[row.user_id] || 0) + 1;
        }
      } else if (countError) {
        console.warn("[admin-users] wedding count query failed:", countError.message);
      }

      // Map to a clean public shape
      const publicUsers = users.map(u => ({
        user_id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        wedding_count: weddingCounts[u.id] || 0
      }));

      return successResponse(publicUsers);
    }

    // ── DELETE: Remove User ──────────────────────────────────────────────────
    if (method === "DELETE") {
      const url = new URL(req.url);
      const userId = url.searchParams.get("id");
      if (!userId) return errorResponse("Missing user id", 400);

      // Prevent an admin from accidentally deleting their own account
      if (userId === user.id) return errorResponse("Cannot delete your own admin account", 400);

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      console.log(`[admin-users] Admin ${user.id} deleted user ${userId}`);
      return successResponse({ deleted: userId });
    }

    return errorResponse("Method not allowed", 405);

  } catch (error: any) {
    console.error(`[admin-users] Error:`, error.message);
    return errorResponse(error.message, 500);
  }
});
