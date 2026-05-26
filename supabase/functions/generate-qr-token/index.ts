/**
 * generate-qr-token — Create or rotate a QR token for a wedding
 *
 * Requires: authenticated user (JWT in Authorization header)
 * Body: { wedding_nanoid: string }
 * Returns: { token: string, qr_url: string }
 *
 * Behavior:
 * - If an active (non-revoked) token exists: returns it (idempotent)
 * - If called with { rotate: true }: revokes existing, creates new token
 * - Token format: 12-char alphanumeric (a-z A-Z 0-9)
 * - Token entropy: 62^12 ≈ 3.2 × 10^21 combinations
 */
export const config = { auth: false };

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';
import { corsHeaders, errorResponse, successResponse, getAuthUser } from '../_shared/utils.ts';
import { checkRateLimit } from '../_shared/redis.ts';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://wedtrackss.in';

/** Generate a cryptographically random alphanumeric token */
function generateToken(length = 12): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map(b => ALPHABET[b % ALPHABET.length])
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Missing Authorization header', 401);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const user = await getAuthUser(supabaseClient, authHeader.replace('Bearer ', ''));
    if (!user) return errorResponse('Unauthorized', 401);

    // ── Rate limit: 30 token generations per user per hour ────────────────────
    const rateLimit = await checkRateLimit(`gen_qr_token:${user.id}`, 30, 3600);
    if (!rateLimit.success) return errorResponse('Rate limit exceeded', 429);

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json();
    const { wedding_nanoid, rotate = false } = body;

    if (!wedding_nanoid) return errorResponse('Missing wedding_nanoid', 400);

    // ── Verify wedding ownership via service role ─────────────────────────────
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: wedding, error: wError } = await adminClient
      .from('weddings')
      .select('id, nanoid, user_id, payment_status')
      .eq('nanoid', wedding_nanoid)
      .maybeSingle();

    if (wError || !wedding) return errorResponse('Wedding not found', 404);
    if (wedding.user_id !== user.id) return errorResponse('Forbidden', 403);
    if (wedding.payment_status !== 'paid') return errorResponse('Wedding not active', 402);

    // ── Check for existing active token ───────────────────────────────────────
    const { data: existingToken } = await adminClient
      .from('qr_tokens')
      .select('id, token, revoked')
      .eq('wedding_id', wedding.id)
      .eq('revoked', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Return existing token if not rotating
    if (existingToken && !rotate) {
      const token = existingToken.token;
      return successResponse({
        token,
        qr_url: `${FRONTEND_URL}/q/${token}`,
        is_new: false,
      });
    }

    // ── Revoke existing tokens if rotating ────────────────────────────────────
    if (rotate && existingToken) {
      await adminClient
        .from('qr_tokens')
        .update({ revoked: true })
        .eq('wedding_id', wedding.id)
        .eq('revoked', false);

      console.log(`[generate-qr-token] Revoked old tokens for wedding ${wedding.id}`);
    }

    // ── Generate new token (with collision check) ─────────────────────────────
    let newToken: string;
    let attempts = 0;

    do {
      newToken = generateToken(12);
      const { data: collision } = await adminClient
        .from('qr_tokens')
        .select('id')
        .eq('token', newToken)
        .maybeSingle();

      if (!collision) break; // No collision — safe to use
      attempts++;
    } while (attempts < 5); // Theoretical collision probability is negligible; 5 is more than enough

    if (attempts >= 5) return errorResponse('Token generation failed — retry', 500);

    // ── Insert new token ──────────────────────────────────────────────────────
    const { error: insertError } = await adminClient
      .from('qr_tokens')
      .insert({ token: newToken, wedding_id: wedding.id });

    if (insertError) {
      console.error('[generate-qr-token] Insert failed:', insertError.message);
      return errorResponse('Failed to generate token', 500);
    }

    console.log(`[generate-qr-token] New token created for wedding ${wedding.nanoid}: ${newToken}`);

    return successResponse({
      token: newToken,
      qr_url: `${FRONTEND_URL}/q/${newToken}`,
      is_new: true,
    });

  } catch (err: any) {
    console.error('[generate-qr-token] Unexpected error:', err?.message || err);
    return errorResponse(err?.message || 'Internal server error', 500);
  }
});
