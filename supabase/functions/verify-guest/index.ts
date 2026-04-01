import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { corsHeaders, errorResponse, successResponse } from "../_shared/utils.ts";
import * as jose from "https://deno.land/x/jose@v5.2.3/index.ts";

/**
 * Get Google OAuth2 Access Token for FCM v1
 */
async function getAccessToken(serviceAccount: any) {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new jose.SignJWT({
    iss: serviceAccount.client_email,
    // FCM v1 requires the firebase.messaging scope specifically
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })
    .setProtectedHeader({ alg: "RS256" })
    .sign(await jose.importPKCS8(serviceAccount.private_key, "RS256"));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`OAuth token exchange failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ── Step 1: Extract and validate the Authorization header ──────────────
    const authHeader = req.headers.get("Authorization");
    console.log("[verify-guest] Auth header present:", !!authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("Missing or malformed Authorization header", 401);
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return errorResponse("Empty bearer token", 401);
    }

    // ── Step 2: Use service role client for all DB operations ─────────────
    // The service role key bypasses RLS completely — safe here because we
    // manually verify ownership (wedding.user_id === user.id) below.
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // ── Step 3: Verify the user's JWT using the admin client ───────────────
    // getUser() makes a server-side call to Supabase Auth to validate the JWT.
    // This is the correct way — avoids re-initialising with anon key.
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);

    console.log("[verify-guest] Auth result:", { userId: user?.id, error: authError?.message });

    if (authError || !user) {
      return errorResponse(`Unauthorized: ${authError?.message ?? "Invalid or expired token"}`, 401);
    }

    // ── Step 4: Parse body ─────────────────────────────────────────────────
    const body = await req.json();
    const { guest_id } = body;

    if (!guest_id) return errorResponse("guest_id is required", 400);

    console.log("[verify-guest] Verifying guest_id:", guest_id, "for user:", user.id);

    // ── Step 5: Fetch Guest + Wedding to verify ownership ─────────────────
    const { data: guest, error: guestError } = await adminClient
      .from("guests")
      .select(`
        id, 
        fullname, 
        amount, 
        payment_status, 
        fcm_token, 
        phone_number,
        wedding:wedding_id (
          id, 
          user_id, 
          bride_name, 
          groom_name, 
          selected_plan
        )
      `)
      .eq("id", guest_id)
      .single();

    if (guestError || !guest) {
      console.error("[verify-guest] Guest fetch error:", guestError?.message);
      return errorResponse("Guest not found", 404);
    }

    const wedding = guest.wedding as any;
    console.log("[verify-guest] Wedding owner:", wedding.user_id, "| Request user:", user.id);

    // Ensure the logged-in host owns this wedding
    if (wedding.user_id !== user.id) return errorResponse("Forbidden", 403);
    if (guest.payment_status === "paid") return errorResponse("Guest already verified", 400);

    // ── Step 6: Mark Guest as Paid ─────────────────────────────────────────
    const { error: updateError } = await adminClient
      .from("guests")
      .update({
        payment_status: "paid",
        is_paid: true,
      })
      .eq("id", guest_id);

    if (updateError) {
      console.error("[verify-guest] Update error:", updateError.message);
      throw updateError;
    }

    console.log("[verify-guest] Guest marked as paid:", guest_id);

    // ── Step 7: Send Notification (non-blocking — never fail verification) ─
    const plan = wedding.selected_plan || "basic";
    const { fullname: guestName, amount, fcm_token } = guest;
    const { bride_name: brideName, groom_name: groomName } = wedding;

    try {
      if (plan === "pro") {
        await sendWhatsAppNotification(guest, wedding);
      } else if (fcm_token) {
        await sendFCMNotification(fcm_token, guestName, amount, brideName, groomName);
        // Update notification_sent only if this column exists
        await adminClient
          .from("guests")
          .update({ notification_sent: true })
          .eq("id", guest_id);
      } else {
        console.log("[verify-guest] No FCM token for guest — skipping push notification.");
      }
    } catch (notifErr: any) {
      // Log but never fail the whole verification because of a notification error
      console.error("[verify-guest] Notification failed (non-fatal):", notifErr?.message ?? notifErr);
    }

    return successResponse({ verified: true, plan });

  } catch (error: any) {
    console.error("[verify-guest] Unhandled error:", error?.message ?? error);
    return errorResponse(error.message ?? "Internal server error", 500);
  }
});

// ─── FCM v1 HTTP API ────────────────────────────────────────────────────────

async function sendFCMNotification(
  fcmToken: string,
  guestName: string,
  amount: number,
  bride: string,
  groom: string
) {
  const serviceAccountStr = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  if (!serviceAccountStr) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT secret");

  const serviceAccount = JSON.parse(serviceAccountStr);
  const accessToken = await getAccessToken(serviceAccount);

  const projectId = serviceAccount.project_id;
  if (!projectId) throw new Error("Missing project_id in FIREBASE_SERVICE_ACCOUNT");

  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const payload = {
    message: {
      token: fcmToken,
      notification: {
        title: "Payment Verified ✅",
        body: `₹${amount} received. Thank you for attending ${bride} ❤️ ${groom}`,
      },
      android: {
        priority: "high",
        notification: { sound: "default" },
      },
      webpush: {
        headers: { Urgency: "high" },
        notification: {
          icon: "/logo.jpeg",
          badge: "/logo.jpeg",
        },
      },
    },
  };

  console.log(`[FCM] Sending to token: ${fcmToken.substring(0, 20)}...`);

  const res = await fetch(fcmUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await res.json();

  if (!res.ok) {
    console.error(`[FCM] HTTP ${res.status}:`, JSON.stringify(responseBody));
    throw new Error(`FCM HTTP ${res.status}: ${JSON.stringify(responseBody?.error ?? responseBody)}`);
  }

  console.log("[FCM] Sent successfully:", JSON.stringify(responseBody));
  return responseBody;
}

// ─── Twilio WhatsApp ────────────────────────────────────────────────────────

async function sendWhatsAppNotification(guest: any, wedding: any) {
  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioFrom = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

  if (!twilioSid || !twilioToken || !twilioFrom)
    throw new Error("Missing Twilio credentials");

  const guestName = guest.fullname || "Guest";
  const { bride_name: brideName, groom_name: groomName } = wedding;
  const amount = guest.amount;

  const toPhone = guest.phone_number?.trim().startsWith("+")
    ? guest.phone_number.trim()
    : `+91${guest.phone_number?.trim()}`;

  const messageBody = `Hello ${guestName},\nYour payment of ₹${amount} for ${brideName} & ${groomName}'s wedding has been verified ✅\nThank you for your blessings! 🙏\n– WedTrack`;

  const formParams = new URLSearchParams();
  formParams.append("To", `whatsapp:${toPhone}`);
  formParams.append(
    "From",
    twilioFrom.startsWith("whatsapp:") ? twilioFrom : `whatsapp:${twilioFrom}`
  );
  formParams.append("Body", messageBody);

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formParams,
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Twilio error: ${errorData.message}`);
  }
}
