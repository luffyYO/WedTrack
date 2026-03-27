export const config = {
  auth: false,
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'
import { corsHeaders, successResponse, errorResponse } from '../_shared/utils.ts'
import { checkRateLimit } from '../_shared/redis.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const nanoid = url.searchParams.get('wedding_nanoid')?.trim()

    console.log('[get-wedding-details] nanoid:', nanoid, 'len:', nanoid?.length)

    if (!nanoid) {
      return errorResponse('Missing wedding_nanoid parameter', 400)
    }

    // ─── Rate Limit: 200 req/min per IP ──────────────────────────────────────
    // Per-IP rate limiting matches real-world production: each guest phone = unique IP.
    // For k6 load tests, ensure x-forwarded-for is set per VU.
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = await checkRateLimit(`get_details:${clientIp}`, 200, 60)
    if (!rateLimit.success) {
      return new Response(
        JSON.stringify({ success: false, message: 'Rate limit exceeded. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
    }

    // ─── DB Query ─────────────────────────────────────────────────────────────
    // SERVICE_ROLE_KEY bypasses RLS — safe here because we only SELECT public data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const selectFields = `
      id,
      nanoid,
      bride_name,
      groom_name,
      wedding_date,
      location,
      village,
      qr_link,
      qr_activation_time,
      qr_expires_at,
      qr_activated_at,
      gallery_images,
      event_type,
      person_name
    `

    // Support both short nanoid AND full UUID — the QR page may navigate with either
    const isUuid = nanoid.length === 36 && nanoid.includes('-')
    const { data, error } = isUuid
      ? await supabase.from('weddings').select(selectFields).eq('id', nanoid).limit(1)
      : await supabase.from('weddings').select(selectFields).eq('nanoid', nanoid).limit(1)

    if (error) {
      console.error('[get-wedding-details] DB error:', JSON.stringify(error))
      return errorResponse(`Database error: ${error.message}`, 500)
    }

    if (!data || data.length === 0) {
      console.warn('[get-wedding-details] Not found for nanoid:', nanoid)
      return errorResponse('Wedding not found', 404)
    }

    const wedding = data[0]
    const now = new Date()

    // ─── Compute qr_status (column does not exist in DB) ─────────────────────
    // Logic:
    //   - 'active':   activation_time is past AND not yet expired
    //   - 'inactive': activation_time is in the future (not started yet)
    //   - 'expired':  expires_at is in the past
    let qr_status = 'active'

    if (wedding.qr_expires_at && now >= new Date(wedding.qr_expires_at)) {
      qr_status = 'expired'
    } else if (wedding.qr_activation_time && now < new Date(wedding.qr_activation_time)) {
      qr_status = 'inactive'
    }

    const responseData = {
      ...wedding,
      qr_status,
      // Alias for frontend compatibility if needed
      date: wedding.wedding_date,
    }

    const response = successResponse(responseData)
    // Cache for 30 seconds — ideal for repeated QR scans at a venue
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
    return response

  } catch (err: any) {
    console.error('[get-wedding-details] Unhandled error:', err.message, err.stack)
    return errorResponse(err.message || 'Internal server error', 500)
  }
})