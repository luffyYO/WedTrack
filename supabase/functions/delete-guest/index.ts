
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

    const { guest_id } = await req.json();
    if (!guest_id) return errorResponse("Guest ID is required", 400);

    const { error: deleteError } = await supabaseClient
      .from("guests")
      .delete()
      .eq("id", guest_id);

    if (deleteError) throw deleteError;

    return successResponse(null, "Guest entry deleted successfully");
  } catch (error: any) {
    return errorResponse(error.message);
  }
});
