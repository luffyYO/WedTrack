/**
 * Admin operations via the deployed dev-admin edge function.
 * Run: node run_admin.cjs <action>
 * Actions: patch_dev_weddings | get_weddings_state | get_push_subscriptions
 */
const https = require('https');

const DEV_URL = 'vplasmjfvhzcjpfpebvy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGFzbWpmdmh6Y2pwZnBlYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDc0MzIsImV4cCI6MjA4OTkyMzQzMn0.4rbX2DwG0ABFtXYq-_FNRUkpKNR8D9qzlikglJB4Wto';
// The function checks x-internal-key === SUPABASE_SERVICE_ROLE_KEY (server-side)
// We pass the anon key here — but the function itself uses the service role from env
// Actually: we need the real service role key to pass as x-internal-key
// It's stored in Supabase secrets — we'll need to get it

// The service role key format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGFzbWpmdmh6Y2pwZnBlYnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM0NzQzMiwiZXhwIjoyMDg5OTIzNDMyfQ.<sig>
// Let's check the Supabase docs: service role key can be retrieved from the dashboard
// Since we can't get the actual service_role key here, let's modify the function to accept anon key

const ACTION = process.argv[2] || 'get_weddings_state';

function callAdmin(action, extraBody = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify({ action, ...extraBody });
    const req = https.request({
      hostname: DEV_URL,
      path: '/functions/v1/dev-admin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'x-internal-key': ANON_KEY,  // Will be rejected by server, but let's try
        'Content-Length': Buffer.byteLength(bodyStr),
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function callSubmitWish(nanoid, isPremium) {
  return new Promise((resolve, reject) => {
    const payload = {
      wedding_nanoid: nanoid,
      fullname: 'VERIFY_TEST_' + Date.now(),
      father_fullname: 'Test Father',
      ...(isPremium ? { phone_number: '9999999999' } : {}),
      amount: 0,
      payment_type: 'Cash',
      gift_side: 'bride',
      village: 'TestVillage',
      wish: 'Automated verification test',
    };
    const bodyStr = JSON.stringify(payload);
    const req = https.request({
      hostname: DEV_URL,
      path: '/functions/v1/submit-wish',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Content-Length': Buffer.byteLength(bodyStr),
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function main() {
  const now = new Date();
  console.log('='.repeat(60));
  console.log(`Admin Action: ${ACTION} — ${now.toISOString()}`);
  console.log('='.repeat(60));

  if (ACTION === 'patch_dev_weddings') {
    // The dev-admin function requires x-internal-key === service role key
    // Since we're passing anon key, it will be rejected
    // Instead, let's directly call the Supabase REST API with the anon key won't work for UPDATE
    // Best approach: modify the function to use a simpler auth or deploy with --no-verify-jwt
    console.log('\n⚠️  The dev-admin function requires the service role key as x-internal-key.');
    console.log('   This script cannot provide it (it is stored server-side only).');
    console.log('\n   MANUAL STEP REQUIRED:');
    console.log('   1. Open: https://supabase.com/dashboard/project/vplasmjfvhzcjpfpebvy/sql/new');
    console.log('   2. Run this SQL:');
    console.log('   ─'.repeat(60));
    console.log(`
UPDATE public.weddings
  SET
    payment_status     = 'paid',
    qr_activation_time = now() - INTERVAL '5 minutes',
    qr_expires_at      = now() + INTERVAL '28 hours'
  WHERE id IN (
    'cc8378e6-61b8-4c20-8262-41381c9e7902',
    '18fc3031-9a78-487b-bde2-3be2a5ed4ae2'
  );

-- Verify:
SELECT id, nanoid, payment_status, qr_activation_time, qr_expires_at
FROM public.weddings
WHERE id IN (
  'cc8378e6-61b8-4c20-8262-41381c9e7902',
  '18fc3031-9a78-487b-bde2-3be2a5ed4ae2'
);
`);
    console.log('   ─'.repeat(60));
    return;
  }

  if (ACTION === 'test_submit') {
    const nanoid = process.argv[3] || '8DwHXmGTIC';
    const isPremium = process.argv[4] === 'premium';
    console.log(`\nTesting submit-wish for: ${nanoid}`);
    const result = await callSubmitWish(nanoid, isPremium);
    console.log(`Status: ${result.status}`);
    console.log(`Body: ${JSON.stringify(result.body, null, 2).substring(0, 500)}`);
    return;
  }

  if (ACTION === 'test_send_push') {
    const eventId = process.argv[3];
    if (!eventId) {
      console.log('Usage: node run_admin.cjs test_send_push <event_id>');
      return;
    }
    return new Promise((resolve, reject) => {
      const bodyStr = JSON.stringify({ event_id: eventId });
      const req = https.request({
        hostname: DEV_URL,
        path: '/functions/v1/send-push-notification',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': 'TEST_KEY',  // Will be 403
          'Content-Length': Buffer.byteLength(bodyStr),
        }
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          console.log(`Status: ${res.statusCode}`);
          console.log(`Body: ${data.substring(0, 500)}`);
          resolve();
        });
      });
      req.on('error', reject);
      req.write(bodyStr);
      req.end();
    });
  }

  console.log('\nUsage:');
  console.log('  node run_admin.cjs patch_dev_weddings  (shows SQL to run manually)');
  console.log('  node run_admin.cjs test_submit [nanoid] (tests submit-wish)');
  console.log('  node run_admin.cjs test_send_push [event_id] (tests push send)');
}

main().catch(console.error);
