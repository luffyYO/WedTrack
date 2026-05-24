export const config = {
  auth: false,
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'
import { corsHeaders, successResponse, errorResponse, logEvent } from '../_shared/utils.ts'
import { checkRateLimit } from '../_shared/redis.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Correlation ID for cross-function tracing
  const correlationId = crypto.randomUUID().substring(0, 8)
  const log = (level: 'INFO' | 'WARN' | 'ERROR', msg: string, data?: Record<string, unknown>) => {
    const line = `[submit-wish][${correlationId}][${level}] ${msg}` +
      (data ? ` | ${JSON.stringify(data)}` : '')
    if (level === 'ERROR') console.error(line)
    else if (level === 'WARN') console.warn(line)
    else console.log(line)
  }

  try {
    const body = await req.json()
    const {
      wedding_nanoid,
      fullname,
      father_fullname,
      phone_number,
      amount,
      payment_type,
      gift_side,
      village,
      wish,
      fcm_token
    } = body

    log('INFO', `Request received`, { wedding_nanoid, guest: fullname })

    if (!wedding_nanoid) return errorResponse('Missing wedding_nanoid', 400)
    if (!fullname) return errorResponse('fullname is required', 400)
    if (!father_fullname) return errorResponse('father_fullname is required', 400)
    if (!village) return errorResponse('village/town is required', 400)
    if (!gift_side) return errorResponse('gift_side is required', 400)

    // Rate Limiting (100 req/min per IP)
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = await checkRateLimit(`submit_wish:${clientIp}`, 100, 60)
    if (!rateLimit.success) return errorResponse('Too many submissions. Try again later.', 429)

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Resolve nanoid → wedding UUID + validate timing
    const { data: weddingRows, error: wError } = await adminClient
      .from('weddings')
      .select('id, qr_activation_time, qr_expires_at, payment_status, selected_plan')
      .eq('nanoid', wedding_nanoid.trim())
      .eq('payment_status', 'paid')
      .limit(1)

    log('INFO', 'Wedding lookup result', {
      nanoid: wedding_nanoid,
      found: !!(weddingRows && weddingRows.length > 0),
      db_error: wError ? wError.message : null,
    })

    if (wError) return errorResponse(`DB error: ${wError.message}`, 500)
    if (!weddingRows || weddingRows.length === 0) return errorResponse('Wedding not found', 404)

    const wedding = weddingRows[0]

    // Determine plan — anything other than 'premium'/'349'/'pro' is treated as basic
    const isPremiumPlan = wedding.selected_plan === 'premium' || wedding.selected_plan === '349' || wedding.selected_plan === 'pro'

    // Plan-conditional phone_number validation
    if (isPremiumPlan && !phone_number) {
      return errorResponse('phone_number is required for premium plan', 400)
    }

    // 2. Timing validation
    const now = new Date()
    log('INFO', 'QR timing check', {
      now: now.toISOString(),
      qr_activation_time: wedding.qr_activation_time,
      qr_expires_at: wedding.qr_expires_at,
      wedding_id: wedding.id,
    })

    if (wedding.qr_activation_time && now < new Date(wedding.qr_activation_time)) {
      log('WARN', 'QR not yet active', { qr_activation_time: wedding.qr_activation_time })
      return errorResponse('QR form is not active yet', 403)
    }
    if (wedding.qr_expires_at && now > new Date(wedding.qr_expires_at)) {
      log('WARN', 'QR expired', { qr_expires_at: wedding.qr_expires_at })
      return errorResponse('QR form has Expired', 403)
    }

    // 3. Insert guest — columns match actual DB schema
    const { data: guest, error: dbError } = await adminClient
      .from('guests')
      .insert({
        wedding_id: wedding.id,
        fullname: fullname.trim(),
        father_fullname: father_fullname?.trim() || null,
        // Only store phone_number for premium plan
        phone_number: isPremiumPlan ? (phone_number?.trim() || null) : null,
        amount: Number(amount) || 0,
        gift_side,
        village: village?.trim() || null,
        payment_type: payment_type || 'Cash',
        payment_status: 'pending',
        is_paid: false,
        is_read: false,
        wishes: wish?.trim() || null,
        // Only store FCM token for premium plan (push notifications)
        fcm_token: isPremiumPlan ? (fcm_token || null) : null
      })
      .select('id')
      .single()

    if (dbError) {
      log('ERROR', 'Guest insert failed', { error: dbError.message, wedding_id: wedding.id })
      throw dbError
    }

    log('INFO', 'Guest inserted', { guest_id: guest?.id, wedding_id: wedding.id })
    logEvent('WishSubmitted', { wedding_id: wedding.id, guest_id: guest?.id })

    // ── Trigger browser push notification (fire-and-forget) ───────────────────
    // Scope: ONLY for new guest entry alerts via Web Push (VAPID).
    // This is completely separate from the in-app bell / wish system.
    // A failure here must NEVER break the guest submission.
    const supabaseUrl    = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (supabaseUrl && serviceRoleKey) {
      const pushUrl = `${supabaseUrl}/functions/v1/send-push-notification`
      log('INFO', 'Dispatching push notification', { push_url: pushUrl, event_id: wedding.id })
      try {
        // We await the fetch to ensure Deno doesn't kill the isolate before the request fires.
        const pushRes = await fetch(pushUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-key': serviceRoleKey,
          },
          body: JSON.stringify({ event_id: wedding.id }),
        })
        const pushResText = await pushRes.text()
        log('INFO', 'Push dispatch response', {
          http_status: pushRes.status,
          response_body: pushResText.substring(0, 300),
          event_id: wedding.id,
        })
      } catch (pushErr: any) {
        // Swallow — push delivery is best-effort, never blocks submission
        log('WARN', 'Push dispatch network error', {
          error: pushErr?.message,
          event_id: wedding.id,
        })
      }
    } else {
      log('WARN', 'Missing env for push dispatch', {
        supabase_url_present: !!supabaseUrl,
        service_role_key_present: !!serviceRoleKey,
      })
    }

    return successResponse({ id: guest?.id })

  } catch (error: any) {
    console.error(`[submit-wish][${correlationId}][ERROR] Unhandled exception:`, error?.message ?? error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
