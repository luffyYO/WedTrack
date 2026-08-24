/**
 * admin-qrs — QR Distribution Analytics for the admin dashboard.
 *
 * Returns a list of weddings with their QR status and QR link info.
 * Supports optional filtering via ?filter=active|expired|all (default: all).
 *
 * Auth: Requires a valid Supabase JWT with app_metadata.role === "admin"
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders, errorResponse, successResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey    = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // ── 1. Authenticate ───────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing Authorization header", 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    // ── 2. Authorize: require admin role ─────────────────────────────────────
    const isAdmin = user.app_metadata?.role === "admin";
    if (!isAdmin) return errorResponse("Forbidden: admin role required", 403);

    // ── 3. Service role client for unrestricted DB reads ─────────────────────
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 4. Parse filter parameter ────────────────────────────────────────────
    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") ?? "all";
    const now = new Date().toISOString();

    // ── 5. Build query ──────────────────────────────────────────────────────
    let query = adminClient
      .from("weddings")
      .select("id, nanoid, bride_name, groom_name, payment_status, qr_activation_time, qr_expires_at, created_at")
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false });

    if (filter === "active") {
      query = query
        .gt("qr_expires_at", now)
        .or(`qr_activation_time.is.null,qr_activation_time.lte.${now}`);
    } else if (filter === "expired") {
      query = query.lte("qr_expires_at", now);
    }
    // 'all' → no additional filters

    const { data: weddings, error: queryError } = await query;

    if (queryError) {
      console.error("[admin-qrs] Query error:", queryError.message);
      throw queryError;
    }

    // ── 6. Map to QR analytics shape ─────────────────────────────────────────
    const siteUrl = Deno.env.get("SITE_URL") || Deno.env.get("PUBLIC_SITE_URL") || "https://wedtrackss.in";

    const result = (weddings ?? []).map((w: any) => {
      const isExpired = w.qr_expires_at && new Date(w.qr_expires_at) < new Date();
      const isNotYetActive = w.qr_activation_time && new Date(w.qr_activation_time) > new Date();
      const status = isExpired ? "expired" : isNotYetActive ? "pending" : "active";

      return {
        id: w.id,
        name: `${w.bride_name} & ${w.groom_name}`,
        qr_link: w.nanoid ? `${siteUrl}/q/${w.nanoid}` : `${siteUrl}/g/${w.id}`,
        status,
        expires_at: w.qr_expires_at,
        activation_time: w.qr_activation_time,
        created_at: w.created_at,
      };
    });

    return successResponse(result);

  } catch (error: any) {
    console.error("[admin-qrs] Unexpected error:", error?.message ?? error);
    return errorResponse(error?.message || "Internal server error", 500);
  }
});
