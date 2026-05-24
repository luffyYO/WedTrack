/**
 * Test the full E2E push notification chain:
 * submit-wish → send-push-notification → push provider → browser
 */
const https = require('https');

const DEV_URL = 'vplasmjfvhzcjpfpebvy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGFzbWpmdmh6Y2pwZnBlYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDc0MzIsImV4cCI6MjA4OTkyMzQzMn0.4rbX2DwG0ABFtXYq-_FNRUkpKNR8D9qzlikglJB4Wto';
const DEV_ADMIN_TOKEN = 'wedtrack-dev-admin-2026';

// Primary active wedding for testing
const ACTIVE_NANOID = '8DwHXmGTIC';
const ACTIVE_EVENT_ID = 'cc8378e6-61b8-4c20-8262-41381c9e7902';

function post(path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req = https.request({
      hostname: DEV_URL,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Content-Length': Buffer.byteLength(bodyStr),
        ...extraHeaders,
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers }); }
        catch { resolve({ status: res.statusCode, body: data, headers: res.headers }); }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function main() {
  const now = new Date();
  console.log('='.repeat(70));
  console.log(`Push Notification E2E Test — ${now.toISOString()}`);
  console.log('='.repeat(70));

  // Test 1: submit-wish (which internally calls send-push-notification)
  console.log('\n[Step 1] submit-wish → triggers send-push-notification (fire-and-forget)');
  const submitResult = await post('/functions/v1/submit-wish', {
    wedding_nanoid: ACTIVE_NANOID,
    fullname: 'E2E_PUSH_TEST_' + Date.now(),
    father_fullname: 'E2E Test Father',
    amount: 1,
    payment_type: 'Cash',
    gift_side: 'bride',
    village: 'E2ETestVillage',
    wish: 'E2E push notification verification test',
  });
  console.log(`  Status: ${submitResult.status}`);
  console.log(`  Body: ${JSON.stringify(submitResult.body).substring(0, 300)}`);
  if (submitResult.status === 200) {
    console.log('  ✅ submit-wish succeeded');
    console.log('  📋 Check send-push-notification logs in Supabase Dashboard');
    console.log('     https://supabase.com/dashboard/project/vplasmjfvhzcjpfpebvy/functions/send-push-notification/logs');
  } else {
    console.log('  ❌ submit-wish failed — cannot proceed with push test');
    return;
  }

  // Give the async push dispatch a moment to complete  
  console.log('\n  Waiting 3 seconds for push dispatch to complete...');
  await new Promise(r => setTimeout(r, 3000));

  // Test 2: Check function logs via API (would need log API access - not available via REST)
  // Instead, check the subscription status after
  console.log('\n[Step 2] Verify push subscription still exists (not cleaned up as expired)');
  const subCheck = await post('/functions/v1/dev-admin', 
    { action: 'get_push_subscriptions' },
    { 'x-internal-key': DEV_ADMIN_TOKEN }
  );
  if (subCheck.status === 200) {
    const subs = subCheck.body.data || [];
    const activeSub = subs.find(s => s.event_id === ACTIVE_EVENT_ID);
    if (activeSub) {
      console.log(`  ✅ Subscription still exists for active event`);
      console.log(`     endpoint: ${activeSub.endpoint.substring(0, 60)}...`);
    } else if (subs.length === 0) {
      console.log('  ⚠️ All subscriptions deleted — the push endpoint returned 404/410 (subscription expired)');
      console.log('     This means the saved FCM token is stale and user needs to re-subscribe.');
      console.log('     Expected behavior — the user needs to click "Enable" on the dashboard again.');
    } else {
      console.log(`  ℹ️ ${subs.length} subscription(s) exist but not for active event`);
      for (const s of subs) {
        console.log(`     event_id=${s.event_id}`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('PUSH E2E TEST COMPLETE');
  console.log('\nNEXT STEPS:');
  console.log('1. Check Supabase logs for send-push-notification:');
  console.log('   https://supabase.com/dashboard/project/vplasmjfvhzcjpfpebvy/functions/send-push-notification/logs');
  console.log('2. Open the dashboard in browser with push notifications enabled');
  console.log('3. Submit a guest from the QR form at:');
  console.log(`   https://wedtracks.in/form/${ACTIVE_NANOID}`);
  console.log('4. Verify browser notification appears');
  console.log('='.repeat(70));
}

main().catch(console.error);
