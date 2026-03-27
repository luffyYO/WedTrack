
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, createErrorResponse, createSuccessResponse, getAuthUser } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const user = await getAuthUser(supabaseClient);
    if (!user) return createErrorResponse("Unauthorized", 401);

    // Fetch weddings owned by this user
    const { data: weddings, error: fetchError } = await supabaseClient
      .from("weddings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) throw fetchError;

    return createSuccessResponse(weddings, "Weddings fetched successfully", {
      "Cache-Control": "private, max-age=10", // Fast local cache for user-specific data
    });
  } catch (error: any) {
    return createErrorResponse(error.message);
  }
});
