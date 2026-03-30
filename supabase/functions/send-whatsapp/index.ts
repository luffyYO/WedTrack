import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"
import { corsHeaders, successResponse, errorResponse } from "../_shared/utils.ts"

export const config = {
  auth: false,
};

// Deno is natively available in Edge Functions


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get request body
    const body = await req.json()
    const { guest_id } = body

    if (!guest_id) {
      return errorResponse('guest_id is required', 400)
    }

    // 2. Initialize Supabase Admin Client
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 3. Fetch Guest and Wedding details
    const { data: guest, error: guestError } = await adminClient
      .from('guests')
      .select(`
        id, 
        fullname, 
        phone_number, 
        payment_status, 
        message_sent_at,
        is_paid,
        weddings (
          bride_name,
          groom_name
        )
      `)
      .eq('id', guest_id)
      .single()

    if (guestError || !guest) {
      console.error('[send-whatsapp] Error fetching guest:', guestError)
      return errorResponse('Guest not found', 404)
    }

    // 4. Validate Guest Data
    // Check either payment_status is paid OR the legacy is_paid boolean is true
    if (guest.payment_status !== 'paid' && !guest.is_paid) {
      return errorResponse('Guest is not marked as paid', 400)
    }

    if (!guest.phone_number) {
      return errorResponse('Guest does not have a phone number', 400)
    }

    if (guest.message_sent_at) {
      return errorResponse('Message already sent to this guest', 400)
    }

    // Fallback name if fullname isn't fully migrated yet
    const guestName = guest.fullname || 'Guest'
    const brideName = guest.weddings?.bride_name || 'the Bride'
    const groomName = guest.weddings?.groom_name || 'the Groom'

    // 5. Format WhatsApp Message
    const messageBody = `Hello ${guestName},
Your gift has been successfully received and verified 💖
Thank you for celebrating with ${brideName} & ${groomName} 🙏
– WedTrack`

    // 6. Twilio Credentials from Environment Variables
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')?.trim()
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')?.trim()
    const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_NUMBER')?.trim()

    if (!twilioSid || !twilioToken || !twilioFrom) {
      console.error('[send-whatsapp] Missing Twilio environment variables')
      return errorResponse('Server misconfiguration (Twilio)', 500)
    }

    // Ensure phone_number is properly formatted (e.g. +91XXXXXXXXXX)
    let toPhone = guest.phone_number.trim()
    if (!toPhone.startsWith('+')) {
      // Assuming India as default if missing country code, but best practice is to force UI to send +
      toPhone = `+91${toPhone}`
    }

    // 7. Send via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
    const basicAuth = `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`

    // Ensure twilioFrom has whatsapp: prefix
    let fromPhone = twilioFrom.trim()
    if (!fromPhone.startsWith('whatsapp:')) {
      fromPhone = `whatsapp:${fromPhone}`
    }

    const formParams = new URLSearchParams()
    formParams.append('To', `whatsapp:${toPhone}`)
    formParams.append('From', fromPhone)
    formParams.append('Body', messageBody)

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': basicAuth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formParams
    })

    const twilioResult = await twilioResponse.json()

    if (!twilioResponse.ok) {
      console.error('[send-whatsapp] Twilio API Error:', twilioResult)
      return errorResponse(`Twilio err: ${twilioResult.message}`, 500)
    }

    console.log(`[send-whatsapp] Message sent successfully. SID: ${twilioResult.sid}`)

    // 8. Update message_sent_at
    const { error: updateError } = await adminClient
      .from('guests')
      .update({ message_sent_at: new Date().toISOString() })
      .eq('id', guest_id)

    if (updateError) {
      console.error('[send-whatsapp] Failed to record message_sent_at:', updateError)
      // We don't fail the request here since the message *was* actually sent
    }

    return successResponse({ success: true, messageId: twilioResult.sid })

  } catch (err: any) {
    console.error('[send-whatsapp] Uncaught error:', err)
    return errorResponse(err.message || 'Internal Server Error', 500)
  }
})
