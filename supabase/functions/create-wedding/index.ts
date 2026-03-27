
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
      event_type,
      person_name,
      gallery_images 
    } = body

    // 1. Validate required fields early
    if (!bride_name || !groom_name) {
      return errorResponse('bride_name and groom_name are required', 400)
    }
    if (!wedding_date) {
      return errorResponse('wedding_date is required', 400)
    }

    // 2. Auth Check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[create-wedding] Missing Authorization header')
      return errorResponse('Missing Authorization header', 401)
    }

    const token = authHeader.replace('Bearer ', '')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      console.error('[create-wedding] Auth failed:', authError?.message)
      return errorResponse('Unauthorized', 401)
    }

    // 3. Rate Limiting (20 req/min)
    const rateLimit = await checkRateLimit(`create_wedding:${user.id}`, 20, 60)
    if (!rateLimit.success) return errorResponse('Rate limit exceeded. Try again later.', 429)

    // 4. Generation & DB Write
    const weddingNanoId = nanoid(10)
    const qr_activation_time = new Date(`${wedding_date}T00:00:00+05:30`).toISOString()
    const qr_expires_at = new Date(new Date(qr_activation_time).getTime() + 24 * 60 * 60 * 1000).toISOString()
    
    // Service role client needed for DB writes
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://wedtrackss.in'
    
    const insertData: Record<string, any> = {
      nanoid: weddingNanoId,
      user_id: user.id,
      bride_name,
      groom_name,
      location: location || null,
      wedding_date,
      village: village || null,
      extra_cell: extra_cell || null,
      upi_id: upi_id || null,
      event_type: event_type || null,
      person_name: person_name || null,
      gallery_images: gallery_images || [],
      qr_activation_time,
      qr_expires_at,
      qr_link: `${frontendUrl}/guest-form/${weddingNanoId}`
    }

    console.log('[create-wedding] Inserting:', JSON.stringify(insertData))

    const { data: wedding, error: dbError } = await adminClient
      .from('weddings')
      .insert(insertData)
      .select('id, nanoid, qr_link')
      .single()

    if (dbError) {
      console.error('[create-wedding] DB insert error:', JSON.stringify(dbError))
      return errorResponse(`Database error: ${dbError.message}`, 500)
    }

    logEvent('WeddingCreated', { user_id: user.id, wedding_nanoid: weddingNanoId })

    return successResponse(wedding)

  } catch (error: any) {
    console.error('[create-wedding] Unexpected error:', error)
    return errorResponse(error?.message || 'Internal server error', 500)
  }
})
