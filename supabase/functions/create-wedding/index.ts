
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'
import { nanoid } from 'https://deno.land/x/nanoid@v3.0.0/mod.ts'
import { corsHeaders, successResponse, errorResponse, logEvent } from '../_shared/utils.ts'
import { checkRateLimit } from '../_shared/redis.ts'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log(`[create-wedding] Request body: ${JSON.stringify(body)}`)
    const { 
      bride_name, 
      groom_name, 
      wedding_date, 
      location, 
      upi_id, 
      village, 
      extra_cell,
      gallery_images 
    } = body

    // 1. Auth Check
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) return errorResponse('Unauthorized', 401)

    // 2. Rate Limiting (20 req/min)
    const rateLimit = await checkRateLimit(`create_wedding:${user.id}`, 20, 60)
    if (!rateLimit.success) return errorResponse('Rate limit exceeded. Try again later.', 429)

    // 3. Generation & DB Write
    const weddingNanoId = nanoid(10)
    const qr_activation_time = new Date(`${wedding_date}T00:00:00+05:30`).toISOString()
    const qr_expires_at = new Date(new Date(qr_activation_time).getTime() + 24 * 60 * 60 * 1000).toISOString()
    
    // Service role client needed for some system-level updates
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: wedding, error: dbError } = await adminClient
      .from('weddings')
      .insert({
        nanoid: weddingNanoId,
        user_id: user.id,
        bride_name,
        groom_name,
        wedding_date,
        location,
        upi_id,
        village,
        extra_cell,
        gallery_images,
        qr_activation_time,
        qr_expires_at,
        qr_link: `${Deno.env.get('FRONTEND_URL')}/guest-form/${weddingNanoId}`
      })
      .select('id, nanoid, qr_link')
      .single()

    if (dbError) throw dbError

    logEvent('WeddingCreated', { user_id: user.id, wedding_nanoid: weddingNanoId })

    return successResponse(wedding)

  } catch (error) {
    return errorResponse(error.message)
  }
})
