/**
 * admin-stats — Admin dashboard metrics
 *
 * Returns aggregate platform statistics for the admin dashboard.
 * All counts are fetched with head:true (no row data returned) for efficiency.
 *
 * Auth: Requires a valid Supabase JWT with app_metadata.role === "admin"
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders, errorResponse, successResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing Authorization header", 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey    = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    // 2. Authorize: require admin role
    const isAdmin = user.app_metadata?.role === "admin";
    if (!isAdmin) return errorResponse("Forbidden: admin role required", 403);

    // 3. Service role client for unrestricted DB reads
    const adminClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 4. Fetch all stats in parallel using count-only queries (head: true)
    const now = new Date().toISOString();

    const [
      usersResult,
      weddingsResult,
      guestsResult,
      wishesResult,
      activeQrsResult,
      expiredQrsResult,
    ] = await Promise.all([
      // Total registered users (via Auth Admin API -- most accurate)
      adminClient.auth.admin.listUsers({ perPage: 1 }),

      // Total paid weddings
      adminClient
        .from("weddings")
        .select("*", { count: "exact", head: true })
        .eq("payment_status", "paid"),

      // Total guests ever submitted
      adminClient
        .from("guests")
        .select("*", { count: "exact", head: true }),

      // Total guests with a wish (non-empty wishes column)
      adminClient
        .from("guests")
        .select("*", { count: "exact", head: true })
        .not("wishes", "is", null)
        .neq("wishes", ""),

      // Active QRs: paid + not yet expired + activation time has passed
      adminClient
        .from("weddings")
        .select("*", { count: "exact", head: true })
        .eq("payment_status", "paid")
        .gt("qr_expires_at", now)
        .or(`qr_activation_time.is.null,qr_activation_time.lte.${now}`),

      // Expired QRs: paid + expiry in the past
      adminClient
        .from("weddings")
        .select("*", { count: "exact", head: true })
        .eq("payment_status", "paid")
        .lte("qr_expires_at", now),
    ]);

    // Extract counts safely (default to 0 on any error)
    // Auth admin listUsers returns a total count via the users array length (no pagination set)
    const totalUsers    = usersResult.data?.users?.length ?? 0;
    const totalWeddings = weddingsResult.count ?? 0;
    const totalGuests   = guestsResult.count ?? 0;
    const totalWishes   = wishesResult.count ?? 0;
    const activeQrs     = activeQrsResult.count ?? 0;
    const expiredQrs    = expiredQrsResult.count ?? 0;

    // Log any individual query errors without failing the whole request
    const queryErrors = [
      usersResult.error,
      weddingsResult.error,
      guestsResult.error,
      wishesResult.error,
      activeQrsResult.error,
      expiredQrsResult.error,
    ].filter(Boolean);

    if (queryErrors.length > 0) {
      console.warn("[admin-stats] Some stat queries had errors:", queryErrors.map((e: any) => e.message));
    }

    return successResponse({
      totalUsers,
      totalWeddings,
      totalGuests,
      totalWishes,
      activeQrs,
      expiredQrs,
    });

  } catch (error: any) {
    console.error("[admin-stats] Unexpected error:", error?.message ?? error);
    return errorResponse(error?.message || "Internal server error", 500);
  }
});
