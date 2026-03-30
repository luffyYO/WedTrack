import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'
import { nanoid } from 'https://deno.land/x/nanoid@v3.0.0/mod.ts'
import { corsHeaders, successResponse, errorResponse, logEvent } from '../_shared/utils.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id } = await req.json()
    if (!order_id) return errorResponse('Missing order_id', 400)

    // Verify checking Cashfree API
    const isProd = Deno.env.get('CASHFREE_ENV') === 'PROD'
    const cfEndpoint = isProd ? `https://api.cashfree.com/pg/orders/${order_id}` : `https://sandbox.cashfree.com/pg/orders/${order_id}`
    const cfAppId = Deno.env.get('CASHFREE_APP_ID')
    const cfSecret = Deno.env.get('CASHFREE_SECRET_KEY')

    if (!cfAppId || !cfSecret) return errorResponse('Payment gateway not configured', 500)

    const cfRes = await fetch(cfEndpoint, {
      method: 'GET',
      headers: {
        'x-client-id': cfAppId,
        'x-client-secret': cfSecret,
        'x-api-version': '2023-08-01',
        'Accept': 'application/json'
      }
    })

    const cfData = await cfRes.json()
    if (!cfRes.ok) {
        console.error('[verify-payment] Error fetching from CF:', cfData);
        return errorResponse('Failed to fetch payment status', 500)
    }

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceKey) return errorResponse('Missing service role key', 500)
    const adminClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey)

    // Lookup Wedding Draft
    const { data: wedding, error: fetchErr } = await adminClient
      .from('weddings')
      .select('id, payment_status, nanoid, qr_link, user_id')
      .eq('cf_order_id', order_id)
      .single()

    if (fetchErr || !wedding) return errorResponse('Order not found', 404)

    // Avoid duplicate verification generating new nanoid
    if (wedding.payment_status === 'paid' && wedding.nanoid) {
        return successResponse({
            id: wedding.id,
            nanoid: wedding.nanoid,
            qr_link: wedding.qr_link,
            status: 'ALREADY_PAID'
        })
    }

    if (cfData.order_status === 'PAID') {
        const weddingNanoId = nanoid(10)
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://wedtrackss.in'
        const qr_link = `${frontendUrl}/guest-form/${weddingNanoId}`

        const updateData = {
            payment_status: 'paid',
            payment_verified_at: new Date().toISOString(),
            nanoid: weddingNanoId,
            qr_link: qr_link
        }

        const { data: updatedWedding, error: updErr } = await adminClient
            .from('weddings')
            .update(updateData)
            .eq('id', wedding.id)
            .select('id, nanoid, qr_link')
            .single()

        if (updErr) return errorResponse('Failed to update draft', 500)

        logEvent('WeddingPaid', { user_id: wedding.user_id, order_id: order_id })
        
        return successResponse({
            id: updatedWedding.id,
            nanoid: updatedWedding.nanoid,
            qr_link: updatedWedding.qr_link,
            status: 'SUCCESS'
        })
    } else {
        // 'ACTIVE', 'EXPIRED', etc.
        if (cfData.order_status === 'EXPIRED' || cfData.order_status === 'TERMINATED') {
            await adminClient.from('weddings').update({ payment_status: 'failed' }).eq('id', wedding.id)
        }
        return errorResponse(`Payment status is ${cfData.order_status}`, 400)
    }

  } catch (error: any) {
    console.error('[verify-payment] err:', error)
    return errorResponse(error?.message || 'Server error', 500)
  }
})
