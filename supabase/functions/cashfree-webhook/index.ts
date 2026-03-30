import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'
import { nanoid } from 'https://deno.land/x/nanoid@v3.0.0/mod.ts'
import { corsHeaders, successResponse, errorResponse, logEvent } from '../_shared/utils.ts'
// Utilizing Web Crypto API standard to Deno
import { encodeHex } from "https://deno.land/std@0.208.0/encoding/hex.ts";

async function verifyCashfreeSignature(payloadString: string, timestamp: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const dataToSign = encoder.encode(timestamp + payloadString);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, dataToSign);
    const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    return computedSignature === signature;
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const signature = req.headers.get('x-webhook-signature')
    const timestamp = req.headers.get('x-webhook-timestamp')
    if (!signature || !timestamp) return errorResponse('Missing signature headers', 400)

    const rawBody = await req.text()

    const cfSecret = Deno.env.get('CASHFREE_SECRET_KEY')
    if (!cfSecret) return errorResponse('Missing secret', 500)

    const isValid = await verifyCashfreeSignature(rawBody, timestamp, signature, cfSecret)
    if (!isValid) return errorResponse('Invalid Signature', 401)

    const event = JSON.parse(rawBody)
    const { order, payment } = event.data || {}
    const order_id = order?.order_id

    if (!order_id) return errorResponse('Missing order_id in payload', 400)

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceKey) return errorResponse('Missing service key', 500)
    const adminClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey)

    // Lookup Wedding Draft
    const { data: wedding, error: fetchErr } = await adminClient
      .from('weddings')
      .select('id, payment_status, nanoid')
      .eq('cf_order_id', order_id)
      .single()

    if (fetchErr || !wedding) return errorResponse('Order not found in DB', 404)

    // Only process if it's currently unpaid
    if (wedding.payment_status === 'paid' && wedding.nanoid) {
        return successResponse({ message: 'Already processed' })
    }

    if (event.type === 'PAYMENT_SUCCESS_WEBHOOK') {
        const weddingNanoId = nanoid(10)
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://wedtrackss.in'
        const qr_link = `${frontendUrl}/guest-form/${weddingNanoId}`

        const updateData = {
            payment_status: 'paid',
            payment_verified_at: new Date().toISOString(),
            payment_method: payment?.payment_group || 'Unknown',
            nanoid: weddingNanoId,
            qr_link: qr_link
        }

        const { error: updErr } = await adminClient
            .from('weddings')
            .update(updateData)
            .eq('id', wedding.id)

        if (updErr) return errorResponse('Failed to update draft', 500)

        logEvent('WeddingPaidWebhook', { order_id: order_id })
        
        return successResponse({ message: 'Webhook processed successfully' })
    }

    if (event.type === 'PAYMENT_FAILED_WEBHOOK') {
        await adminClient.from('weddings').update({ payment_status: 'failed' }).eq('id', wedding.id)
        return successResponse({ message: 'Marked as failed based on webhook' })
    }

    return successResponse({ message: 'Unhandled event type.' })
  } catch (err: any) {
    console.error('[webhook] Error', err)
    return errorResponse(err?.message || 'Server Error', 500)
  }
})
