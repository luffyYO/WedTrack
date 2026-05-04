
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders, errorResponse, successResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ── Step 1: Extract and validate Authorization header ──────────────────
    const authHeader = req.headers.get("Authorization");
    console.log("[delete-guest] Auth header present:", !!authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("Missing or malformed Authorization header", 401);
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return errorResponse("Empty bearer token", 401);

    // ── Step 2: Use service role client for ALL operations ─────────────────
    // Service role key is required so getUser() can validate the token
    // server-side without being blocked by RLS.
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // ── Step 3: Validate the user's JWT ───────────────────────────────────
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    console.log("[delete-guest] Auth result:", { userId: user?.id, error: authError?.message });

    if (authError || !user) {
      return errorResponse(`Unauthorized: ${authError?.message ?? "Invalid or expired token"}`, 401);
    }

    // ── Step 4: Parse body ─────────────────────────────────────────────────
    const { guest_id } = await req.json();
    if (!guest_id) return errorResponse("guest_id is required", 400);

    console.log("[delete-guest] Deleting guest_id:", guest_id, "for user:", user.id);

    // ── Step 5: Fetch guest + wedding to verify ownership ─────────────────
    const { data: guest, error: guestError } = await adminClient
      .from("guests")
      .select("id, wedding_id, is_paid")
      .eq("id", guest_id)
      .single();

    if (guestError || !guest) return errorResponse("Guest not found", 404);

    // ── Step 6: Block deletion of VERIFIED (paid) entries ─────────────────
    if (guest.is_paid) return errorResponse("Cannot delete a verified guest entry", 403);

    // ── Step 7: Confirm the wedding belongs to the requesting user ─────────
    const { data: wedding, error: weddingError } = await adminClient
      .from("weddings")
      .select("user_id")
      .eq("id", guest.wedding_id)
      .single();

    if (weddingError || !wedding) return errorResponse("Wedding not found", 404);
    if (wedding.user_id !== user.id) {
      console.error("[delete-guest] Forbidden: wedding owner mismatch");
      return errorResponse("Forbidden", 403);
    }

    // ── Step 8: Delete ─────────────────────────────────────────────────────
    const { error: deleteError } = await adminClient
      .from("guests")
      .delete()
      .eq("id", guest_id);

    if (deleteError) throw deleteError;

    console.log("[delete-guest] Deleted successfully:", guest_id);
    return successResponse({ deleted: true });

  } catch (error: any) {
    console.error("[delete-guest] Unhandled error:", error?.message ?? error);
    return errorResponse(error.message ?? "Internal server error", 500);
  }
});
