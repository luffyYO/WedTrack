import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders, errorResponse, successResponse, getAuthUser } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const wedding_id = url.searchParams.get('wedding_id')?.trim();

    if (!wedding_id) {
      return errorResponse('Missing wedding_id parameter', 400);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing Authorization header", 401);
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const user = await getAuthUser(supabaseClient, token);
    if (!user) return errorResponse("Unauthorized", 401);

    // Verify the user owns the wedding before fetching guests
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: wedding, error: wError } = await adminClient
      .from('weddings')
      .select('user_id')
      .eq('id', wedding_id)
      .single();

    if (wError || !wedding) {
      return errorResponse("Wedding not found", 404);
    }

    if (wedding.user_id !== user.id) {
      return errorResponse("Unauthorized to view these guests", 403);
    }

    // Now fetch guests
    const { data: guests, error: fetchError } = await adminClient
      .from("guests")
      .select("*")
      .eq("wedding_id", wedding_id)
      .order("created_at", { ascending: false });

    if (fetchError) throw fetchError;

    const res = successResponse(guests);
    res.headers.set("Cache-Control", "private, max-age=10");
    return res;
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
});
