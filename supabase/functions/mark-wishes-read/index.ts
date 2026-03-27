
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, errorResponse, successResponse, getAuthUser } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const user = await getAuthUser(supabaseClient);
    if (!user) return errorResponse("Unauthorized", 401);

    const { wedding_id } = await req.json();
    if (!wedding_id) return errorResponse("Wedding ID is required", 400);

    const { error: updateError } = await supabaseClient
      .from("wishes")
      .update({ is_read: true })
      .eq("wedding_id", wedding_id)
      .eq("is_read", false);

    if (updateError) throw updateError;

    return successResponse(null, "Wishes marked as read");
  } catch (error: any) {
    return errorResponse(error.message);
  }
});
