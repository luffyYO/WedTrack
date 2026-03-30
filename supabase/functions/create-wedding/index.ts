
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
      gallery_images,
      selected_plan,
      amount
    } = body

    // 1. Validate required fields early
    if (!bride_name || !groom_name) {
      return errorResponse('bride_name and groom_name are required', 400)
    }
    if (!wedding_date) {
      return errorResponse('wedding_date is required', 400)
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return errorResponse('Valid amount is required', 400)
    }
    const finalAmount = Number(amount)

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
    // Calculate QR activation and expiration based on wedding date (all UTC)
    const now = new Date()
    
    // Parse wedding_date as YYYY-MM-DD in UTC to avoid timezone shifts
    const [wy, wm, wd] = String(wedding_date).split('-').map(Number)
    const weddingDayUTC = Date.UTC(wy, wm - 1, wd) // midnight UTC on wedding day
    
    // Today at midnight UTC for comparison
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    
    let qr_activation_time: string
    let qr_expires_at: string
    
    if (weddingDayUTC > todayUTC) {
      // Future wedding: QR is on hold — activates at midnight UTC on the wedding date
      qr_activation_time = new Date(weddingDayUTC).toISOString()
      qr_expires_at = new Date(weddingDayUTC + 24 * 60 * 60 * 1000).toISOString()
    } else {
      // Today or past: QR activates immediately and expires exactly 24 hours from now
      qr_activation_time = now.toISOString()
      qr_expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    }
    
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceKey) return errorResponse('Server misconfiguration: missing service key', 500)
    const adminClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey)

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://wedtrackss.in'

    // Cashfree PG Setup
    const isProd = Deno.env.get('CASHFREE_ENV') === 'PROD'
    const cfEndpoint = isProd ? 'https://api.cashfree.com/pg/orders' : 'https://sandbox.cashfree.com/pg/orders'
    const cfAppId = Deno.env.get('CASHFREE_APP_ID')
    const cfSecret = Deno.env.get('CASHFREE_SECRET_KEY')

    if (!cfAppId || !cfSecret) {
      console.error('[create-wedding] Cashfree keys missing')
      return errorResponse('Payment gateway not configured', 500)
    }

    const orderId = `wt_${Date.now()}_${user.id.substring(0,8)}`

    const cfPayload = {
      order_amount: finalAmount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: user.id,
        customer_phone: "9999999999", // Placeholder unless you have user phone
        customer_name: user?.user_metadata?.full_name || "User"
      },
      order_meta: {
        return_url: `${frontendUrl.replace('http://localhost', 'https://localhost')}/wedding-track/verify?order_id=${orderId}`
      }
    }

    const cfRes = await fetch(cfEndpoint, {
      method: 'POST',
      headers: {
        'x-client-id': cfAppId,
        'x-client-secret': cfSecret,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(cfPayload)
    })

    const cfData = await cfRes.json()
    if (!cfRes.ok) {
      console.error('[create-wedding] Cashfree order failed:', cfData)
      return errorResponse(`Cashfree Error: ${cfData.message || cfData.type || 'Failed to initiate payment'}`, 500)
    }

    // Insert as DRAFT
    const insertData: Record<string, any> = {
      user_id: user.id,
      bride_name,
      groom_name,
      location: location || '',
      wedding_date,
      village: village || '',
      extra_cell: extra_cell || '',
      upi_id: upi_id || '',
      event_type: event_type || 'wedding',
      person_name: person_name || null,
      gallery_images: gallery_images || [],
      qr_activation_time,
      qr_expires_at,

      // --- Payment Status Tracking ---
      payment_status: 'unpaid',
      cf_order_id: orderId,
      payment_amount: finalAmount,
      selected_plan: selected_plan || 'basic'
    }

    console.log('[create-wedding] Inserting Draft:', JSON.stringify(insertData))

    const { data: wedding, error: dbError } = await adminClient
      .from('weddings')
      .insert(insertData)
      .select('id, cf_order_id')
      .single()

    if (dbError) {
      console.error('[create-wedding] DB insert error:', JSON.stringify(dbError))
      return errorResponse(`Database error: ${dbError.message}`, 500)
    }

    logEvent('WeddingDraftCreated', { user_id: user.id, order_id: orderId })

    // Return the payment session details to the frontend
    return successResponse({
      id: wedding.id,
      payment_session_id: cfData.payment_session_id,
      order_id: orderId
    })

  } catch (error: any) {
    console.error('[create-wedding] Unexpected error:', error)
    return errorResponse(error?.message || 'Internal server error', 500)
  }
})
