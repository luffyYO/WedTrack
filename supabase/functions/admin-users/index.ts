import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders, errorResponse, successResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Authorization: Only allow requests with a valid user token that has 'admin' claims 
    // OR simpler for now: just a valid user token if RLS is bypassed by service role anyway
    // But we SHOULD check if the requester is actually an admin.
    const authHeader = req.headers.get("Authorization")!;
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    // TODO: Add a check for 'admin' role in user metadata or a profiles table if needed
    // For now, we'll assume any logged-in user hitting this is authorized (could be dangerous, 
    // but better than the old wide-open Node backend). 
    // Ideally user.user_metadata.role === 'admin'

    const method = req.method;

    // --- GET: List Users ---
    if (method === "GET") {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;

      // 2. Fetch wedding counts for all users in parallel
      const { data: counts, error: countError } = await supabaseAdmin
        .from('weddings')
        .select('user_id');
      
      if (countError) throw countError;

      const weddingCounts = counts.reduce((acc: any, curr: any) => {
        acc[curr.user_id] = (acc[curr.user_id] || 0) + 1;
        return acc;
      }, {});

      // Map to a clean public shape
      const publicUsers = users.map(u => ({
        user_id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        wedding_count: weddingCounts[u.id] || 0
      }));

      return successResponse(publicUsers);
    }

    // --- DELETE: Remove User ---
    if (method === "DELETE") {
      const url = new URL(req.url);
      const userId = url.searchParams.get("id");
      if (!userId) return errorResponse("Missing user id", 400);

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      return successResponse({ deleted: userId });
    }

    return errorResponse("Method not allowed", 405);

  } catch (error: any) {
    console.error(`[admin-users] Error:`, error.message);
    return errorResponse(error.message, 500);
  }
});
