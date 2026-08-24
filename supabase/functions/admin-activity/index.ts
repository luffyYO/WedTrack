/**
 * admin-activity — Paginated admin audit log
 *
 * Returns records from admin_audit_log in descending chronological order.
 * Requires any active admin (admin or super_admin).
 *
 * Query params:
 *   page   (default: 1)
 *   limit  (default: 50, max: 100)
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

    // ── 3. Service role client ─────────────────────────────────────────────────
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 4. Parse pagination params ─────────────────────────────────────────────
    const url = new URL(req.url);
    const page  = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));
    const offset = (page - 1) * limit;

    // ── 5. Fetch audit log ─────────────────────────────────────────────────────
    const { data: logs, error: logsErr, count } = await adminClient
      .from("admin_audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsErr) throw logsErr;

    // Enrich with actor email (best-effort)
    const actorIds = [...new Set((logs ?? []).map((l: any) => l.actor_id).filter(Boolean))];
    const actorEmails: Record<string, string> = {};

    if (actorIds.length > 0) {
      const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      for (const u of users ?? []) {
        if (actorIds.includes(u.id)) {
          actorEmails[u.id] = u.user_metadata?.full_name || u.email || u.id;
        }
      }
    }

    const enriched = (logs ?? []).map((log: any) => ({
      ...log,
      actor_display: log.actor_id ? (actorEmails[log.actor_id] ?? log.actor_id.slice(0, 8) + "...") : "System",
    }));

    return successResponse({
      logs: enriched,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        pages: count ? Math.ceil(count / limit) : 0,
      },
    });

  } catch (error: any) {
    console.error("[admin-activity] Unexpected error:", error?.message ?? error);
    return errorResponse(error?.message || "Internal server error", 500);
  }
});
