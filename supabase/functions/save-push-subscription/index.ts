/**
 * save-push-subscription
 *
 * Stores a Web Push (VAPID) subscription for a user + event pair.
 * Deduplicates by (user_id, endpoint) using ON CONFLICT DO UPDATE.
 *
 * Called from: frontend usePushNotifications hook after user grants permission.
 * Authentication: Requires a valid Supabase JWT (Authorization header).
 *
 * Architecture note:
 *   - This function is ONLY for browser push subscriptions (new guest entries).
 *   - It has no relationship to the in-app bell / wish notification system.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'
import { corsHeaders, errorResponse, successResponse } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Correlation ID for tracing
  const correlationId = crypto.randomUUID().substring(0, 8)
  const log = (level: 'INFO' | 'WARN' | 'ERROR', msg: string, data?: Record<string, unknown>) => {
    const line = `[save-push-sub][${correlationId}][${level}] ${msg}` +
      (data ? ` | ${JSON.stringify(data)}` : '')
    if (level === 'ERROR') console.error(line)
    else if (level === 'WARN') console.warn(line)
    else console.log(line)
  }

  try {
    // ── Auth: require a valid JWT ──────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()

    if (!token) {
      log('WARN', 'Missing Authorization token')
      return errorResponse('Unauthorized: missing token', 401)
    }

    // Create a user-scoped client to validate the JWT
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      log('WARN', 'Auth failed', { error: authError?.message })
      return errorResponse('Unauthorized: invalid token', 401)
    }

    // ── Parse Body ────────────────────────────────────────────────────────────
    const body = await req.json()
    const { event_id, subscription, endpoint } = body

    log('INFO', 'Request received', {
      user_id: user.id,
      event_id,
      endpoint_prefix: endpoint ? endpoint.substring(0, 60) : null,
      has_keys: !!(subscription?.keys?.p256dh && subscription?.keys?.auth),
    })

    if (!event_id)     return errorResponse('Missing event_id', 400)
    if (!subscription) return errorResponse('Missing subscription object', 400)
    if (!endpoint)     return errorResponse('Missing endpoint', 400)

    // ── Validate endpoint format (must be a URL) ───────────────────────────────
    try {
      new URL(endpoint)
    } catch {
      log('WARN', 'Invalid endpoint URL', { endpoint: endpoint?.substring(0, 100) })
      return errorResponse('Invalid endpoint URL', 400)
    }

    // Validate subscription has VAPID keys
    const keys = subscription?.keys ?? {}
    if (!keys.p256dh || !keys.auth) {
      log('WARN', 'Subscription missing VAPID keys', {
        has_p256dh: !!keys.p256dh,
        has_auth: !!keys.auth,
      })
      // Don't reject — still save, but warn
    }

    // ── Upsert subscription (deduplicate by user_id + endpoint) ───────────────
    // Use service role to bypass RLS for the upsert itself — the JWT has
    // already been validated above.
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: upsertError } = await adminClient
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          event_id,
          endpoint,
          subscription,
        },
        {
          onConflict: 'user_id,endpoint',
          ignoreDuplicates: false, // update event_id/subscription if changed
        }
      )

    if (upsertError) {
      log('ERROR', 'Upsert failed', { error: upsertError.message, event_id })
      return errorResponse(`DB error: ${upsertError.message}`, 500)
    }

    log('INFO', 'Subscription saved', {
      user_id: user.id,
      event_id,
      endpoint_domain: (() => { try { return new URL(endpoint).hostname } catch { return 'invalid' } })(),
    })
    return successResponse({ saved: true })

  } catch (err: any) {
    console.error(`[save-push-sub][${correlationId}][ERROR] Unhandled:`, err?.message ?? err)
    return errorResponse(err.message || 'Internal server error', 500)
  }
})
