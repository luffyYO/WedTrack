/**
 * trace_push.cjs
 * Direct end-to-end push trace: calls send-push-notification for the active
 * DEV wedding and prints the exact FCM HTTP response status from the logs.
 */
const https = require('https');

const SUPABASE_HOST = 'vplasmjfvhzcjpfpebvy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGFzbWpmdmh6Y2pwZnBlYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDc0MzIsImV4cCI6MjA4OTkyMzQzMn0.4rbX2DwG0ABFtXYq-_FNRUkpKNR8D9qzlikglJB4Wto';

// Active DEV wedding for Sasha Braus (nanoid=BZidYXAIAg)
const ACTIVE_NANOID    = 'BZidYXAIAg';
const ACTIVE_EVENT_ID  = '28792107-405f-4d50-8176-ca97d65cf17c';

function httpsPost(hostname, path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req = https.request(
      {
        hostname,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
          apikey: ANON_KEY,
          ...extraHeaders,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log('='.repeat(70));
  console.log('PUSH TRACE — ' + new Date().toISOString());
  console.log('Active event_id:', ACTIVE_EVENT_ID);
  console.log('='.repeat(70));

  // ── Step 1: Check existing subscriptions ─────────────────────────────────
  console.log('\n[1] Current push_subscriptions for this event_id:');
  const subRes = await httpsPost(
    SUPABASE_HOST,
    '/functions/v1/dev-admin',
    { action: 'get_push_subscriptions' },
    { 'x-internal-key': 'wedtrack-dev-admin-2026' }
  );
  if (subRes.status === 200 && Array.isArray(subRes.body?.data)) {
    const subs = subRes.body.data;
    const matching = subs.filter((s) => s.event_id === ACTIVE_EVENT_ID);
    console.log(`   Total subscriptions in DB: ${subs.length}`);
    console.log(`   Subscriptions for this event: ${matching.length}`);
    if (matching.length > 0) {
      matching.forEach((s, i) => {
        console.log(`   [${i}] id=${s.id}`);
        console.log(`       endpoint=${s.endpoint.substring(0, 80)}...`);
        console.log(`       created_at=${s.created_at}`);
      });
    } else {
      console.log('   ⚠️  NO subscriptions found for this event — push will send 0 notifications!');
      console.log('   All subscriptions:', JSON.stringify(subs.map(s => ({ id: s.id, event_id: s.event_id, endpoint_prefix: s.endpoint.substring(0, 40) })), null, 2));
    }
  } else {
    console.log('   dev-admin status:', subRes.status, JSON.stringify(subRes.body));
  }

  // ── Step 2: Submit a real guest (triggers push internally) ────────────────
  console.log('\n[2] Submitting test guest (triggers push fire-and-forget)...');
  const guestName = 'TRACE_TEST_' + Date.now();
  const submitRes = await httpsPost(
    SUPABASE_HOST,
    '/functions/v1/submit-wish',
    {
      wedding_nanoid: ACTIVE_NANOID,
      fullname: guestName,
      father_fullname: 'Trace Father',
      amount: 0,
      payment_type: 'Cash',
      gift_side: 'bride',
      village: 'TraceVillage',
      wish: 'Automated push trace test',
    }
  );
  console.log('   HTTP status:', submitRes.status);
  console.log('   Response:', JSON.stringify(submitRes.body));
  if (submitRes.status !== 200) {
    console.log('\n   ❌ submit-wish FAILED. Cannot test push. Fix this first.');
    return;
  }
  console.log('   ✅ Guest inserted.');

  // ── Step 3: Re-check subscriptions after push ─────────────────────────────
  console.log('\n[3] Waiting 5s for async push dispatch, then re-checking subscriptions...');
  await new Promise((r) => setTimeout(r, 5000));

  const subRes2 = await httpsPost(
    SUPABASE_HOST,
    '/functions/v1/dev-admin',
    { action: 'get_push_subscriptions' },
    { 'x-internal-key': 'wedtrack-dev-admin-2026' }
  );
  if (subRes2.status === 200 && Array.isArray(subRes2.body?.data)) {
    const subs2 = subRes2.body.data;
    const matching2 = subs2.filter((s) => s.event_id === ACTIVE_EVENT_ID);
    console.log(`   Subscriptions for this event AFTER push: ${matching2.length}`);
    if (matching2.length === 0 && subRes.body?.data?.filter(s => s.event_id === ACTIVE_EVENT_ID).length > 0) {
      console.log('   ⚠️  Subscriptions were DELETED after push → FCM returned 404/410 → endpoint is STALE!');
      console.log('   FIX: The browser needs to re-subscribe with the current VAPID key.');
    } else if (matching2.length > 0) {
      console.log('   ✅ Subscriptions still present → FCM accepted the push (200 OK).');
      console.log('   If browser still shows no notification, check service worker sw.js push handler.');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('NEXT: Check Supabase function logs for detailed FCM response:');
  console.log('  https://supabase.com/dashboard/project/vplasmjfvhzcjpfpebvy/functions/send-push-notification/logs');
  console.log('='.repeat(70));
}

main().catch(console.error);
