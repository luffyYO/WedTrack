
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, errorResponse, successResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Create a per-request client using the user's Authorization header
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[list-weddings] Missing Authorization header");
      return errorResponse("Missing Authorization header", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Validate the session — this is what makes list-weddings user-specific
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error("[list-weddings] Auth failed:", authError?.message);
      return errorResponse("Unauthorized", 401);
    }

    console.log(`[list-weddings] Fetching weddings for user: ${user.id}`);

    // Explicit user_id filter — belt-and-suspenders isolation on top of RLS
    const { data: weddings, error: fetchError } = await supabaseClient
      .from("weddings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("[list-weddings] DB error:", JSON.stringify(fetchError));
      return errorResponse(`Database error: ${fetchError.message}`, 500);
    }

    console.log(`[list-weddings] Found ${weddings?.length ?? 0} weddings`);

    return successResponse(weddings ?? []);
  } catch (error: any) {
    console.error("[list-weddings] Unexpected error:", error?.message);
    return errorResponse(error?.message || "Internal server error", 500);
  }
});
