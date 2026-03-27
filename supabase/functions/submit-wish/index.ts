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

  try {
    const body = await req.json()
    const { 
      wedding_nanoid,
      first_name, 
      last_name,
      father_first_name,
      father_last_name,
      amount, 
      payment_type, 
      wishes, 
      gift_side, 
      village, 
      district,
      location
    } = body

    console.log(`[submit-wish] wedding_nanoid: ${wedding_nanoid}, first_name: ${first_name}`)

    if (!wedding_nanoid) return errorResponse('Missing wedding_nanoid', 400)
    if (!first_name) return errorResponse('first_name is required', 400)
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
      .select('id, qr_activation_time, qr_expires_at')
      .eq('nanoid', wedding_nanoid.trim())
      .limit(1)

    console.log('[submit-wish] wedding lookup error:', JSON.stringify(wError))

    if (wError) return errorResponse(`DB error: ${wError.message}`, 500)
    if (!weddingRows || weddingRows.length === 0) return errorResponse('Wedding not found', 404)

    const wedding = weddingRows[0]

    // 2. Timing validation
    const now = new Date()
    if (wedding.qr_activation_time && now < new Date(wedding.qr_activation_time)) {
      return errorResponse('QR form is not active yet', 403)
    }
    if (wedding.qr_expires_at && now > new Date(wedding.qr_expires_at)) {
      return errorResponse('QR form has Expired', 403)
    }

    // 3. Insert guest/wish — using auto-generated UUID id
    const { data: guest, error: dbError } = await adminClient
      .from('guests')
      .insert({
        wedding_id: wedding.id,
        first_name,
        last_name: last_name || null,
        father_first_name: father_first_name || null,
        father_last_name: father_last_name || null,
        amount: Number(amount) || 0,
        payment_type: payment_type || 'Cash',
        wishes: wishes || null,
        gift_side,
        village: village || null,
        district: district || null,
        location: location || null,
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('[submit-wish] insert error:', JSON.stringify(dbError))
      throw dbError
    }

    logEvent('WishSubmitted', { wedding_id: wedding.id, guest_id: guest?.id })

    return successResponse({ id: guest?.id })

  } catch (error: any) {
    console.error('[submit-wish] SERVER ERROR:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
