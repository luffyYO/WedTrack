/**
 * dev-admin — DEV ONLY edge function for admin SQL operations.
 * Protected by x-internal-key = SUPABASE_SERVICE_ROLE_KEY.
 * Blocked in production via ENVIRONMENT env var.
 */

export const config = {
  auth: false,
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'

// ── Production Guard ──────────────────────────────────────────────────────────
// This function is for development/debugging only. If ENVIRONMENT is set to
// "production" in Supabase Edge Function secrets, all requests are rejected.
const ENVIRONMENT = Deno.env.get("ENVIRONMENT") ?? "";
const IS_PRODUCTION = ENVIRONMENT.toLowerCase() === "production";

// ── VAPID Crypto Helpers ──────────────────────────────────────────────────────
function base64UrlToBuffer(b64url: string): ArrayBuffer {
  const padding = '='.repeat((4 - (b64url.length % 4)) % 4)
  const b64 = (b64url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const buf = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i)
  return buf.buffer
}

function bufferToBase64Url(buf: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buf)
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function wrapRawP256KeyInPkcs8(rawKey: ArrayBuffer): ArrayBuffer {
  const raw = new Uint8Array(rawKey)
  if (raw.length !== 32) {
    throw new Error(`[VAPID] Expected 32-byte raw P-256 key, got ${raw.length} bytes`)
  }
  const header = new Uint8Array([
    0x30, 0x41,             // SEQUENCE (65 bytes total)
    0x02, 0x01, 0x00,       // INTEGER version = 0
    0x30, 0x13,             // SEQUENCE AlgorithmIdentifier (19 bytes)
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // OID ecPublicKey
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, // OID P-256
    0x04, 0x27,             // OCTET STRING (39 bytes)
    0x30, 0x25,             // SEQUENCE ECPrivateKey (37 bytes)
    0x02, 0x01, 0x01,       // INTEGER version = 1
    0x04, 0x20,             // OCTET STRING privateKey (32 bytes)
  ])
  const pkcs8 = new Uint8Array(header.length + raw.length)
  pkcs8.set(header)
  pkcs8.set(raw, header.length)
  return pkcs8.buffer
}

async function encryptPayload(plaintext: string, p256dhB64: string, authB64: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder()
  const plaintextBytes = enc.encode(plaintext)

  const p256dhBytes = new Uint8Array(base64UrlToBuffer(p256dhB64))
  const authBytes   = new Uint8Array(base64UrlToBuffer(authB64))

  const ephemeralPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  )

  const subscriberKey = await crypto.subtle.importKey(
    'raw',
    p256dhBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  )

  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: subscriberKey },
    ephemeralPair.privateKey,
    256
  )

  const ephemeralPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', ephemeralPair.publicKey)
  )

  const salt = crypto.getRandomValues(new Uint8Array(16))

  const prk = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(sharedSecret),
    { name: 'HKDF' },
    false,
    ['deriveBits']
  )

  const authInfo = enc.encode('Content-Encoding: auth\0')
  const ikm = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: authBytes, info: authInfo },
    prk,
    256
  ))

  const ikmKey = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits'])

  const keyInfo = enc.encode('Content-Encoding: aes128gcm\0')
  const nonceInfo = enc.encode('Content-Encoding: nonce\0')

  const contentEncryptionKey = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: keyInfo }, ikmKey, 128
  )
  const nonce = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo }, ikmKey, 96
  )

  const aesKey = await crypto.subtle.importKey(
    'raw', contentEncryptionKey, { name: 'AES-GCM' }, false, ['encrypt']
  )

  const padded = new Uint8Array(plaintextBytes.length + 1)
  padded.set(plaintextBytes)
  padded[plaintextBytes.length] = 0x02

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, padded)
  )

  const header = new Uint8Array(21 + ephemeralPublicKeyRaw.length)
  header.set(salt, 0)
  new DataView(header.buffer).setUint32(16, 4096, false)
  header[20] = ephemeralPublicKeyRaw.length
  header.set(ephemeralPublicKeyRaw, 21)

  const result = new Uint8Array(header.length + ciphertext.length)
  result.set(header, 0)
  result.set(ciphertext, header.length)
  return result.buffer
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-key',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Block in production
  if (IS_PRODUCTION) {
    return new Response(
      JSON.stringify({ error: 'dev-admin is disabled in production' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const internalKey = req.headers.get('x-internal-key') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const devAdminToken = Deno.env.get('DEV_ADMIN_TOKEN') ?? '';

  // Accept either the service role key or the dedicated DEV_ADMIN_TOKEN
  const isAuthorized = (internalKey && internalKey === serviceRoleKey) ||
                       (devAdminToken && internalKey === devAdminToken);

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      serviceRoleKey
    );

    if (action === 'patch_dev_weddings') {
      // Patch the most recently created paid weddings to be currently active
      // with a realistic 28-hour window (DEV-only)
      const { target_ids } = body;
      const targetIds = target_ids || [
        'cc8378e6-61b8-4c20-8262-41381c9e7902',  // nanoid: 8DwHXmGTIC
        '18fc3031-9a78-487b-bde2-3be2a5ed4ae2',  // nanoid: 4WIlgYG58Z
        'd5311773-42dc-43a5-b687-5349bcb86dc0',  // nanoid: fdCN2q-3tu
      ];

      const { data, error } = await adminClient
        .from('weddings')
        .update({
          payment_status: 'paid',
          qr_activation_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // now - 5 min
          qr_expires_at: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString(), // now + 28h
        })
        .in('id', targetIds)
        .select('id, nanoid, payment_status, qr_activation_time, qr_expires_at');

      if (error) {
        console.error('[dev-admin] patch_dev_weddings error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[dev-admin] Patched ${data?.length ?? 0} weddings`);
      return new Response(JSON.stringify({ success: true, patched: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_weddings_state') {
      const { data, error } = await adminClient
        .from('weddings')
        .select('id, nanoid, payment_status, selected_plan, qr_activation_time, qr_expires_at')
        .order('created_at', { ascending: false })
        .limit(10);

      return new Response(JSON.stringify({ data, error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_push_subscriptions') {
      const { data, error } = await adminClient
        .from('push_subscriptions')
        .select('id, user_id, event_id, endpoint, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      return new Response(JSON.stringify({ data, error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_push_subscription_by_id') {
      const { subscription_id } = body;
      if (!subscription_id) {
        return new Response(JSON.stringify({ error: 'Missing subscription_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error } = await adminClient
        .from('push_subscriptions')
        .delete()
        .eq('id', subscription_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('[dev-admin] Deleted push subscription:', subscription_id);
      return new Response(JSON.stringify({ success: true, deleted_id: subscription_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'clear_all_push_subscriptions_for_event') {
      const { event_id } = body;
      if (!event_id) {
        return new Response(JSON.stringify({ error: 'Missing event_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data, error } = await adminClient
        .from('push_subscriptions')
        .delete()
        .eq('event_id', event_id)
        .select('id');
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('[dev-admin] Cleared all push subscriptions for event:', event_id, 'count:', data?.length);
      return new Response(JSON.stringify({ success: true, deleted_count: data?.length ?? 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_push_subscriptions_full') {
      // Full subscription data including keys — for debugging only
      const { data, error } = await adminClient
        .from('push_subscriptions')
        .select('id, user_id, event_id, endpoint, subscription, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      return new Response(JSON.stringify({ data, error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_vapid_config') {
      // Returns partial VAPID config to verify which key the server uses.
      // Does NOT expose private key or full public key.
      const pubKey  = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
      const subject = Deno.env.get('VAPID_SUBJECT') ?? '';
      return new Response(JSON.stringify({
        vapid_public_key_prefix: pubKey.substring(0, 20),
        vapid_public_key_length: pubKey.length,
        vapid_subject: subject,
        private_key_present: !!(Deno.env.get('VAPID_PRIVATE_KEY')),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'patch_push_subscription_event_id') {
      // Update stale push subscriptions to point to an active event_id
      const { old_event_id, new_event_id } = body;
      if (!new_event_id) {
        return new Response(JSON.stringify({ error: 'Missing new_event_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // If old_event_id provided, update only those; else update all to new_event_id
      let query = adminClient.from('push_subscriptions').update({ event_id: new_event_id });
      if (old_event_id) {
        query = query.eq('event_id', old_event_id);
      }
      const { data, error } = await query.select('id, user_id, event_id, endpoint');

      if (error) {
        console.error('[dev-admin] patch_push_subscription_event_id error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[dev-admin] Updated ${data?.length ?? 0} push subscriptions to event_id=${new_event_id}`);
      return new Response(JSON.stringify({ success: true, updated: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_vapid_config') {
      // Return VAPID configuration for debugging (keys are redacted to first 20 chars)
      const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
      const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
      const viteVapidPublicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY') ?? '';
      const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? '';

      return new Response(JSON.stringify({
        VAPID_PRIVATE_KEY_present: !!vapidPrivateKey,
        VAPID_PRIVATE_KEY_length: vapidPrivateKey.length,
        VAPID_PUBLIC_KEY_prefix: vapidPublicKey.substring(0, 20),
        VAPID_PUBLIC_KEY_length: vapidPublicKey.length,
        VITE_VAPID_PUBLIC_KEY_prefix: viteVapidPublicKey.substring(0, 20),
        VITE_VAPID_PUBLIC_KEY_length: viteVapidPublicKey.length,
        VAPID_SUBJECT: vapidSubject,
        // The send-push-notification function uses: VITE_VAPID_PUBLIC_KEY ?? VAPID_PUBLIC_KEY
        resolved_public_key_prefix: (viteVapidPublicKey || vapidPublicKey).substring(0, 20),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_stale_push_subscriptions') {
      // Delete push subscriptions for events that don't exist or are expired
      const { data: allSubs, error: subErr } = await adminClient
        .from('push_subscriptions')
        .select('id, event_id, endpoint');

      if (subErr) {
        return new Response(JSON.stringify({ error: subErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: activeWeddings } = await adminClient
        .from('weddings')
        .select('id')
        .eq('payment_status', 'paid')
        .gte('qr_expires_at', new Date().toISOString());

      const activeIds = new Set((activeWeddings || []).map((w: any) => w.id));
      const staleIds = (allSubs || [])
        .filter((s: any) => !activeIds.has(s.event_id))
        .map((s: any) => s.id);

      if (staleIds.length > 0) {
        await adminClient.from('push_subscriptions').delete().in('id', staleIds);
      }

      return new Response(JSON.stringify({
        success: true,
        total_subs: allSubs?.length,
        stale_deleted: staleIds.length,
        active_events: activeIds.size,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'trigger_push_test') {
      const { event_id } = body;
      if (!event_id) {
        return new Response(JSON.stringify({ error: 'Missing event_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const pushUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`;
      const pushRes = await fetch(pushUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': serviceRoleKey,
        },
        body: JSON.stringify({
          event_id,
          payload: {
            body: `Test push triggered from dev-admin at ${new Date().toISOString()}`,
          }
        }),
      });
      const pushResText = await pushRes.text();
      let parsed = pushResText;
      try { parsed = JSON.parse(pushResText); } catch {}
      return new Response(JSON.stringify({
        status: pushRes.status,
        result: parsed
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'diagnose_crypto') {
      const { p256dh, auth, endpoint } = body;
      const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
      const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
      const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? '';

      const steps: string[] = [];
      let errDetail: string | null = null;
      let stack: string | null = null;

      try {
        steps.push("Step 1: check environment variables");
        if (!vapidPrivateKey) throw new Error("VAPID_PRIVATE_KEY is missing");
        if (!vapidPublicKey) throw new Error("VAPID_PUBLIC_KEY is missing");
        if (!vapidSubject) throw new Error("VAPID_SUBJECT is missing");

        steps.push("Step 2: build VAPID JWT");
        const url = new URL(endpoint || "https://fcm.googleapis.com");
        const audience = `${url.protocol}//${url.host}`;
        
        const header = { typ: 'JWT', alg: 'ES256' }
        const now = Math.floor(Date.now() / 1000)
        const payload = { aud: audience, exp: now + 12 * 3600, sub: vapidSubject }

        const headerB64  = bufferToBase64Url(new TextEncoder().encode(JSON.stringify(header)))
        const payloadB64 = bufferToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
        const signingInput = `${headerB64}.${payloadB64}`

        steps.push("Step 2a: decode private key");
        const rawKeyBytes = base64UrlToBuffer(vapidPrivateKey)
        steps.push(`Step 2b: private key byte length = ${rawKeyBytes.byteLength}`);
        
        const pkcs8Bytes = rawKeyBytes.byteLength === 32
          ? wrapRawP256KeyInPkcs8(rawKeyBytes)
          : rawKeyBytes;

        steps.push("Step 2c: import private key (PKCS8)");
        const cryptoKey = await crypto.subtle.importKey(
          'pkcs8',
          pkcs8Bytes,
          { name: 'ECDSA', namedCurve: 'P-256' },
          false,
          ['sign']
        )

        steps.push("Step 2d: test PKCS8 sign with string hash");
        try {
          await crypto.subtle.sign(
            { name: 'ECDSA', hash: 'SHA-256' },
            cryptoKey,
            new TextEncoder().encode(signingInput)
          );
          steps.push("-> PKCS8 sign with string hash succeeded");
        } catch (e: any) {
          steps.push(`-> PKCS8 sign with string hash failed: ${e.message}`);
        }

        steps.push("Step 2d2: test PKCS8 sign with object hash");
        try {
          await crypto.subtle.sign(
            { name: 'ECDSA', hash: { name: 'SHA-256' } },
            cryptoKey,
            new TextEncoder().encode(signingInput)
          );
          steps.push("-> PKCS8 sign with object hash succeeded");
        } catch (e: any) {
          steps.push(`-> PKCS8 sign with object hash failed: ${e.message}`);
        }

        steps.push("Step 2e: import as JWK");
        const pubBytes = new Uint8Array(base64UrlToBuffer(vapidPublicKey));
        steps.push(`Step 2e2: public key bytes decoded, len=${pubBytes.length}, prefix=0x${pubBytes[0].toString(16)}`);
        if (pubBytes[0] !== 0x04 || pubBytes.length !== 65) {
          throw new Error(`Invalid public key format: length=${pubBytes.length}, prefix=${pubBytes[0]}`);
        }
        const xBytes = pubBytes.slice(1, 33);
        const yBytes = pubBytes.slice(33, 65);
        const xB64 = bufferToBase64Url(xBytes);
        const yB64 = bufferToBase64Url(yBytes);
        
        const jwk = {
          kty: "EC",
          crv: "P-256",
          x: xB64,
          y: yB64,
          d: vapidPrivateKey,
        };

        const cryptoKeyJwk = await crypto.subtle.importKey(
          'jwk',
          jwk,
          { name: 'ECDSA', namedCurve: 'P-256' },
          false,
          ['sign']
        );
        steps.push("-> JWK import succeeded");

        steps.push("Step 2f: test JWK sign with string hash");
        try {
          await crypto.subtle.sign(
            { name: 'ECDSA', hash: 'SHA-256' },
            cryptoKeyJwk,
            new TextEncoder().encode(signingInput)
          );
          steps.push("-> JWK sign with string hash succeeded");
        } catch (e: any) {
          steps.push(`-> JWK sign with string hash failed: ${e.message}`);
        }

        steps.push("Step 2f2: test JWK sign with object hash");
        try {
          await crypto.subtle.sign(
            { name: 'ECDSA', hash: { name: 'SHA-256' } },
            cryptoKeyJwk,
            new TextEncoder().encode(signingInput)
          );
          steps.push("-> JWK sign with object hash succeeded");
        } catch (e: any) {
          steps.push(`-> JWK sign with object hash failed: ${e.message}`);
        }

        steps.push("Step 3: encrypt payload");
        const testPayload = JSON.stringify({ title: "Test", body: "Hello" });
        const ciphertext = await encryptPayload(
          testPayload,
          p256dh || "BBSZ5oFORJuRVMMcyJYCM1_fzItlImC5AKVnkowSCVL46kTtxrQ-IfQ8lWg7lQLrZOihmehj-s0ES1kXPIxcAbI",
          auth || "B7W0SI90ah9Dzef7-nVirQ"
        );
        steps.push(`Step 3 completed successfully, ciphertext length = ${ciphertext.byteLength}`);

      } catch (err: any) {
        errDetail = `${err?.name}: ${err?.message}`;
        stack = err?.stack || null;
      }

      return new Response(JSON.stringify({
        success: !errDetail,
        error: errDetail,
        stack,
        steps,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[dev-admin] ERROR:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
