
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders, errorResponse, successResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing Authorization header", 401);
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Explicit token validation — required when Gateway JWT verification is bypassed
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error("[update-guest] Auth failed:", authError?.message || 'No user found');
      return errorResponse(authError?.message || "Unauthorized", 401);
    }

    const body = await req.json();
    const guest_id = body.guest_id;
    // Allow both { update_data: { ... } } and direct fields in the body
    const update_data = body.update_data || { ...body };
    delete (update_data as any).guest_id; // Don't try to update the ID field

    if (!guest_id || Object.keys(update_data).length === 0) {
      return errorResponse("Guest ID and update data are required", 400);
    }

    // Use service role client for the update — guests table may have RLS that blocks direct updates
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey) return errorResponse("Server misconfiguration", 500);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceKey
    );

    // Verify the guest belongs to one of this user's weddings before updating
    const { data: guest, error: guestError } = await adminClient
      .from("guests")
      .select("id, wedding_id")
      .eq("id", guest_id)
      .single();

    if (guestError || !guest) return errorResponse("Guest not found", 404);

    // Confirm the wedding belongs to the requesting user
    const { data: wedding, error: weddingError } = await adminClient
      .from("weddings")
      .select("user_id")
      .eq("id", guest.wedding_id)
      .single();

    if (weddingError || !wedding) return errorResponse("Wedding not found", 404);
    if (wedding.user_id !== user.id) return errorResponse("Forbidden", 403);

    const { error: updateError } = await adminClient
      .from("guests")
      .update(update_data)
      .eq("id", guest_id);

    if (updateError) throw updateError;

    return successResponse({ updated: true });
  } catch (error: any) {
    console.error("[update-guest] error:", error.message);
    return errorResponse(error.message, 500);
  }
});
