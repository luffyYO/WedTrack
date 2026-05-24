export const config = {
  auth: false,
};

/**
 * send-push-notification
 *
 * Sends a Web Push (VAPID) notification to all subscribers of a given event.
 * Uses 100% Native Deno WebCrypto (RFC 8291 compliant) to bypass Node.js crypto
 * polyfill issues that break npm:web-push in Edge environments.
 *
 * Scope: ONLY for new guest entry alerts. Has no relationship to the
 * in-app bell / wish notification system.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'
import { corsHeaders, errorResponse, successResponse } from '../_shared/utils.ts'

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

/**
 * Wrap a raw 32-byte P-256 private key scalar in a PKCS#8 DER envelope.
 *
 * WebCrypto importKey('pkcs8') requires a full PKCS#8 structure, but
 * `web-push generate-vapid-keys` outputs a raw 32-byte base64url scalar.
 * Without this wrapper, importKey() throws a DOMException that gets silently
 * swallowed by sendWebPush's catch block → sent=0, failed=1, no notification.
 *
 * DER structure: SEQUENCE { version=0, AlgorithmIdentifier(ecPublicKey, P-256),
 *                OCTET STRING { ECPrivateKey { version=1, privateKey } } }
 */
function wrapRawP256KeyInPkcs8(rawKey: ArrayBuffer): ArrayBuffer {
  const raw = new Uint8Array(rawKey)
  if (raw.length !== 32) {
    throw new Error(`[VAPID] Expected 32-byte raw P-256 key, got ${raw.length} bytes`)
  }
  // PKCS#8 DER header for P-256 — 35 bytes, followed by the 32-byte private key
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

async function buildVapidJwt(
  privateKeyB64: string,
  subject: string,
  audience: string,
  publicKeyB64: string
): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject }

  const headerB64  = bufferToBase64Url(new TextEncoder().encode(JSON.stringify(header)))
  const payloadB64 = bufferToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const signingInput = `${headerB64}.${payloadB64}`

  // Decode public key to extract coordinates
  const pubBytes = new Uint8Array(base64UrlToBuffer(publicKeyB64))
  if (pubBytes[0] !== 0x04 || pubBytes.length !== 65) {
    throw new Error(`[VAPID] Invalid public key format: length=${pubBytes.length}, prefix=${pubBytes[0]}`)
  }
  const xBytes = pubBytes.slice(1, 33)
  const yBytes = pubBytes.slice(33, 65)
  const xB64 = bufferToBase64Url(xBytes)
  const yB64 = bufferToBase64Url(yBytes)

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: xB64,
    y: yB64,
    d: privateKeyB64,
  }

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  )

  return `${signingInput}.${bufferToBase64Url(signature)}`
}

/**
 * Strict RFC 8291 aes128gcm encryption using Native WebCrypto.
 * Fixes the HKDF info parameters that cause Chrome to silently drop pushes.
 */
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

  // RFC 8291 STRICT parameters (DO NOT append keys or P-256 strings)
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

  // Pad plaintext (add 0x02 delimiter for aes128gcm)
  const padded = new Uint8Array(plaintextBytes.length + 1)
  padded.set(plaintextBytes)
  padded[plaintextBytes.length] = 0x02

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, padded)
  )

  // Build header block (RFC 8291 format: salt + record size + id length + ephemeral key)
  const header = new Uint8Array(21 + ephemeralPublicKeyRaw.length)
  header.set(salt, 0)
  new DataView(header.buffer).setUint32(16, 4096, false) // Record size = 4096
  header[20] = ephemeralPublicKeyRaw.length
  header.set(ephemeralPublicKeyRaw, 21)

  const result = new Uint8Array(header.length + ciphertext.length)
  result.set(header, 0)
  result.set(ciphertext, header.length)
  return result.buffer
}

async function sendWebPush(
  sub: { endpoint: string; subscription: Record<string, any> },
  payload: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
  vapidSubject: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const url = new URL(sub.endpoint)
    const audience = `${url.protocol}//${url.host}`

    const jwt = await buildVapidJwt(vapidPrivateKey, vapidSubject, audience, vapidPublicKey)
    const vapidHeader = `vapid t=${jwt},k=${vapidPublicKey}`

    const keys = sub.subscription?.keys ?? {}
    const p256dh = keys.p256dh
    const auth   = keys.auth

    let body: BodyInit
    let contentEncoding: string

    if (p256dh && auth) {
      body = await encryptPayload(payload, p256dh, auth)
      contentEncoding = 'aes128gcm'
    } else {
      body = new TextEncoder().encode(payload)
      contentEncoding = 'raw'
    }

    const res = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        Authorization: vapidHeader,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': contentEncoding,
        TTL: '86400',
      },
      body,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, status: res.status, error: text }
    }

    return { ok: true, status: res.status }
  } catch (err: any) {
    console.error(`[send-push-notification] sendWebPush threw: ${err?.name}: ${err?.message}`)
    return { ok: false, error: `${err?.name}: ${err?.message}` }
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Correlation ID for tracing this invocation across all log lines
  const correlationId = crypto.randomUUID().substring(0, 8)
  const log = (level: 'INFO' | 'WARN' | 'ERROR', msg: string, data?: Record<string, unknown>) => {
    const line = `[send-push][${correlationId}][${level}] ${msg}` +
      (data ? ` | ${JSON.stringify(data)}` : '')
    if (level === 'ERROR') console.error(line)
    else if (level === 'WARN') console.warn(line)
    else console.log(line)
  }

  const internalKey = req.headers.get('x-internal-key') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!internalKey || internalKey !== serviceRoleKey) {
    log('WARN', 'Forbidden: invalid x-internal-key')
    return errorResponse('Forbidden', 403)
  }

  try {
    const body = await req.json()
    const { event_id, payload } = body

    log('INFO', 'Received request', { event_id })

    if (!event_id) return errorResponse('Missing event_id', 400)

    // VAPID key lookup.
    // NOTE: VAPID_PUBLIC_KEY is the correct secret name (no VITE_ prefix).
    // VITE_VAPID_PUBLIC_KEY is a frontend build-time env var only — it is not
    // available as a Supabase function secret. Using it here would silently
    // fall back to VAPID_PUBLIC_KEY anyway, but we resolve explicitly to avoid confusion.
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    const vapidPublicKey  = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
    const vapidSubject    = Deno.env.get('VAPID_SUBJECT') ?? ''

    log('INFO', 'VAPID config', {
      private_key_present: !!vapidPrivateKey,
      private_key_length: vapidPrivateKey.length,
      public_key_prefix: vapidPublicKey.substring(0, 20),
      public_key_length: vapidPublicKey.length,
      subject: vapidSubject,
    })

    if (!vapidPrivateKey || !vapidPublicKey || !vapidSubject) {
      log('ERROR', 'VAPID secrets not configured', {
        missing: [
          !vapidPrivateKey ? 'VAPID_PRIVATE_KEY' : null,
          !vapidPublicKey  ? 'VAPID_PUBLIC_KEY'  : null,
          !vapidSubject    ? 'VAPID_SUBJECT'     : null,
        ].filter(Boolean)
      })
      return errorResponse('VAPID secrets not configured', 500)
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, serviceRoleKey)

    const { data: subs, error: dbError } = await adminClient
      .from('push_subscriptions')
      .select('endpoint, subscription')
      .eq('event_id', event_id)

    log('INFO', 'DB query result', {
      event_id,
      subscription_count: subs?.length ?? 0,
      db_error: dbError ? dbError.message : null,
    })

    if (dbError) {
      log('ERROR', 'DB error fetching subscriptions', { error: dbError.message, event_id })
      return errorResponse('DB error', 500)
    }

    if (!subs || subs.length === 0) {
      log('INFO', 'No subscribers found for event', { event_id })
      return successResponse({ sent: 0, skipped: 0, event_id })
    }

    log('INFO', 'Loaded subscriptions', { count: subs.length, event_id })
    subs.forEach((sub, i) => {
      const keys = sub.subscription?.keys ?? {}
      log('INFO', `Subscription[${i}]`, {
        endpoint_prefix: sub.endpoint.substring(0, 60),
        has_p256dh: !!keys.p256dh,
        has_auth: !!keys.auth,
        endpoint_domain: (() => { try { return new URL(sub.endpoint).hostname } catch { return 'invalid' } })(),
      })
    })

    const notificationPayload = JSON.stringify({
      title: 'New Guest Added \uD83C\uDF89',
      body: 'A new guest has joined your wedding celebration.',
      icon: '/logo.jpeg',
      badge: '/logo.jpeg',
      url: '/dashboard',
      ...(payload ?? {}),
    })
    log('INFO', 'Dispatching payload', { payload_bytes: notificationPayload.length })

    const results = await Promise.allSettled(
      subs.map((sub) =>
        sendWebPush(sub, notificationPayload, vapidPrivateKey, vapidPublicKey, vapidSubject)
      )
    )

    let sent = 0
    let failed = 0
    const expiredEndpoints: string[] = []
    const details: any[] = []

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const endpoint = subs[i].endpoint
      const endpointShort = endpoint.substring(0, 60)

      if (result.status === 'fulfilled') {
        const r = result.value
        details.push({
          endpoint: endpointShort,
          ok: r.ok,
          status: r.status,
          error: r.error,
        })
        if (r.ok) {
          sent++
          log('INFO', 'Push delivered', { endpoint_prefix: endpointShort, http_status: r.status })
        } else {
          failed++
          log('WARN', 'Push failed', {
            endpoint_prefix: endpointShort,
            http_status: r.status,
            error_body: r.error?.substring(0, 200),
          })
          if (r.status === 404 || r.status === 410) {
            log('INFO', 'Marking endpoint for cleanup (stale subscription)', {
              endpoint_prefix: endpointShort,
              reason: r.status === 410 ? 'Gone (410)' : 'Not Found (404)',
            })
            expiredEndpoints.push(endpoint)
          }
        }
      } else {
        failed++
        const errMsg = result.reason?.message ?? String(result.reason)
        details.push({
          endpoint: endpointShort,
          ok: false,
          error: errMsg,
        })
        log('ERROR', 'Promise rejected for endpoint', {
          endpoint_prefix: endpointShort,
          reason: errMsg,
        })
      }
    }

    if (expiredEndpoints.length > 0) {
      log('INFO', 'Cleaning up expired subscriptions', { count: expiredEndpoints.length })
      adminClient
         .from('push_subscriptions')
         .delete()
         .in('endpoint', expiredEndpoints)
         .then(({ error }) => {
           if (error) log('ERROR', 'Cleanup failed', { error: error.message })
           else log('INFO', 'Cleanup complete', { removed: expiredEndpoints.length })
         })
    }

    log('INFO', 'Finished', { event_id, sent, failed, total: subs.length })
    return successResponse({ sent, failed, event_id, details })

  } catch (err: any) {
    console.error(`[send-push][${correlationId}][ERROR] Unhandled exception:`, err?.message ?? err)
    return errorResponse(err.message || 'Internal server error', 500)
  }
})
