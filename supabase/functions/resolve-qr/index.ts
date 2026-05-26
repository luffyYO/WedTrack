/**
 * resolve-qr — Universal QR Redirect Handler
 *
 * Accepts:  GET /functions/v1/resolve-qr?t={token}
 * Returns:  HTTP 302 redirect to the active wedding form
 *           or to /qr-error?reason=... for invalid/expired/inactive states
 *
 * CRITICAL: Returns 302 (NOT 301) — prevents browsers and UPI app WebViews
 * from permanently caching the redirect, which would break re-routing.
 *
 * CRITICAL: Cache-Control: no-store — prevents Cloudflare from caching
 * redirect responses at the CDN edge.
 */
export const config = { auth: false };

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';
import { checkRateLimit } from '../_shared/redis.ts';

const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://wedtrackss.in';

/** No-cache redirect headers — critical for correctness */
const redirectHeaders = (location: string) => ({
  'Location': location,
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'X-Robots-Tag': 'noindex, nofollow',
  'Access-Control-Allow-Origin': '*',
});

function redirect(reason: string): Response {
  return new Response(null, {
    status: 302,
    headers: redirectHeaders(`${FRONTEND_URL}/qr-error?reason=${reason}`),
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
    });
  }

  const correlationId = crypto.randomUUID().substring(0, 8);
  const log = (level: 'INFO' | 'WARN' | 'ERROR', msg: string, data?: Record<string, unknown>) => {
    const line = `[resolve-qr][${correlationId}][${level}] ${msg}` +
      (data ? ` | ${JSON.stringify(data)}` : '');
    if (level === 'ERROR') console.error(line);
    else if (level === 'WARN') console.warn(line);
    else console.log(line);
  };

  try {
    // ── 1. Extract token from query param ?t=... ──────────────────────────────
    const url = new URL(req.url);
    const token = url.searchParams.get('t')?.trim();

    if (!token || token.length < 6 || token.length > 32) {
      log('WARN', 'Missing or malformed token', { token });
      return redirect('invalid');
    }

    log('INFO', 'QR scan received', { token });

    // ── 2. Rate limit: 120 req/min per IP (aggressive scanners / bots) ────────
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = await checkRateLimit(`resolve_qr:${clientIp}`, 120, 60);
    if (!rateLimit.success) {
      log('WARN', 'Rate limit exceeded', { ip: clientIp });
      return redirect('invalid');
    }

    // ── 3. Token lookup via service role (bypasses RLS for fast path) ─────────
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: tokenRow, error: tokenError } = await adminClient
      .from('qr_tokens')
      .select('id, wedding_id, revoked')
      .eq('token', token)
      .maybeSingle();

    if (tokenError) {
      log('ERROR', 'Token lookup DB error', { error: tokenError.message });
      return redirect('invalid');
    }

    if (!tokenRow) {
      log('WARN', 'Token not found', { token });
      return redirect('invalid');
    }

    if (tokenRow.revoked) {
      log('WARN', 'Revoked token scanned', { token });
      return redirect('invalid');
    }

    // ── 4. Load wedding state ─────────────────────────────────────────────────
    const { data: wedding, error: wError } = await adminClient
      .from('weddings')
      .select('id, nanoid, qr_activation_time, qr_expires_at, payment_status')
      .eq('id', tokenRow.wedding_id)
      .maybeSingle();

    if (wError || !wedding) {
      log('ERROR', 'Wedding not found for token', { token, wedding_id: tokenRow.wedding_id });
      return redirect('invalid');
    }

    log('INFO', 'Wedding found', {
      nanoid: wedding.nanoid,
      payment_status: wedding.payment_status,
      qr_activation_time: wedding.qr_activation_time,
      qr_expires_at: wedding.qr_expires_at,
    });

    // ── 5. Validate payment status ────────────────────────────────────────────
    if (wedding.payment_status !== 'paid') {
      log('WARN', 'Unpaid wedding scanned', { nanoid: wedding.nanoid });
      return redirect('invalid');
    }

    // ── 6. Validate activation time ───────────────────────────────────────────
    const now = Date.now();
    if (wedding.qr_activation_time && new Date(wedding.qr_activation_time).getTime() > now) {
      log('INFO', 'QR not yet active', { nanoid: wedding.nanoid, activation: wedding.qr_activation_time });
      return redirect('inactive');
    }

    // ── 7. Validate expiry ────────────────────────────────────────────────────
    if (wedding.qr_expires_at && new Date(wedding.qr_expires_at).getTime() < now) {
      log('INFO', 'QR expired', { nanoid: wedding.nanoid, expired_at: wedding.qr_expires_at });
      return redirect('expired');
    }

    // ── 8. Fire-and-forget: increment scan count ──────────────────────────────
    // Do NOT await — never let analytics block the redirect
    adminClient
      .rpc('increment_qr_scan_count', { token_id: tokenRow.id })
      .then(() => { /* intentionally discarded */ })
      .catch(() => { /* intentionally discarded — analytics non-critical */ });

    // ── 9. Redirect to active wedding form ────────────────────────────────────
    const nanoid = wedding.nanoid;
    if (!nanoid) {
      log('ERROR', 'Wedding has no nanoid', { wedding_id: wedding.id });
      return redirect('invalid');
    }

    log('INFO', 'Redirecting to active form', { nanoid });

    return new Response(null, {
      status: 302,
      headers: redirectHeaders(`${FRONTEND_URL}/g/${nanoid}`),
    });

  } catch (err: any) {
    console.error(`[resolve-qr] Unexpected error:`, err?.message || err);
    return redirect('invalid');
  }
});
