import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders, errorResponse, successResponse, getAuthUser } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { wedding_nanoid } = await req.json();

    if (!wedding_nanoid) {
      return errorResponse('Missing wedding_nanoid', 400);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const user = await getAuthUser(supabaseClient);
    if (!user) return errorResponse("Unauthorized", 401);

    // Verify ownership and get current expiry
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: wedding, error: wError } = await adminClient
      .from('weddings')
      .select('id, user_id, qr_expires_at')
      .eq('nanoid', wedding_nanoid)
      .single();

    if (wError || !wedding) {
      return errorResponse("Wedding not found", 404);
    }

    if (wedding.user_id !== user.id) {
      return errorResponse("Unauthorized", 403);
    }

    // Calculate new expiry: current expiry + 24 hours (or now + 24 if already expired/null)
    const currentExpiry = wedding.qr_expires_at ? new Date(wedding.qr_expires_at) : new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await adminClient
      .from('weddings')
      .update({ qr_expires_at: newExpiry })
      .eq('id', wedding.id);

    if (updateError) throw updateError;

    return successResponse({ 
      message: 'QR expiration extended by 24 hours', 
      qr_expires_at: newExpiry 
    });

  } catch (error: any) {
    console.error(`[extend-wedding] Error:`, error.message);
    return errorResponse(error.message, 500);
  }
});
