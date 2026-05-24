/**
 * Call dev-admin edge function to patch DEV weddings.
 * Run: node call_admin.cjs patch_dev_weddings
 */
const https = require('https');

const DEV_URL = 'vplasmjfvhzcjpfpebvy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGFzbWpmdmh6Y2pwZnBlYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDc0MzIsImV4cCI6MjA4OTkyMzQzMn0.4rbX2DwG0ABFtXYq-_FNRUkpKNR8D9qzlikglJB4Wto';
const DEV_ADMIN_TOKEN = 'wedtrack-dev-admin-2026';

const ACTION = process.argv[2] || 'get_weddings_state';

function call(path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req = https.request({
      hostname: DEV_URL,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'x-internal-key': DEV_ADMIN_TOKEN,
        'Content-Length': Buffer.byteLength(bodyStr),
        ...extraHeaders,
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

function callGet(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: DEV_URL,
      path,
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        ...headers,
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
    req.end();
  });
}

async function main() {
  const now = new Date();
  console.log('='.repeat(60));
  console.log(`Action: ${ACTION} — ${now.toISOString()}`);
  console.log('='.repeat(60));

  if (ACTION === 'patch_dev_weddings') {
    console.log('\nPatching DEV wedding timing...');
    const result = await call('/functions/v1/dev-admin', { action: 'patch_dev_weddings' });
    console.log(`  Status: ${result.status}`);
    if (result.status === 200) {
      console.log('  ✅ Success!');
      const patched = result.body.patched || [];
      for (const w of patched) {
        console.log(`  Patched: ${w.nanoid || w.id} | qr_expires_at: ${w.qr_expires_at}`);
      }
    } else {
      console.log('  ❌ Failed:', JSON.stringify(result.body));
    }
    return;
  }

  if (ACTION === 'get_state') {
    console.log('\nFetching wedding state...');
    const result = await call('/functions/v1/dev-admin', { action: 'get_weddings_state' });
    console.log(`  Status: ${result.status}`);
    if (result.status === 200) {
      const weddings = result.body.data || [];
      for (const w of weddings) {
        const exp = w.qr_expires_at ? new Date(w.qr_expires_at) : null;
        const act = w.qr_activation_time ? new Date(w.qr_activation_time) : null;
        let status = 'UNKNOWN';
        if (!act) status = 'NO_ACT';
        else if (now < act) status = 'FUTURE';
        else if (exp && now > exp) status = `EXPIRED(${Math.round((now-exp)/60000)}min)`;
        else status = '✅ACTIVE';
        console.log(`  ${status.padEnd(20)} | ${(w.nanoid||'NO_NID').padEnd(12)} | ${w.payment_status}`);
      }

      // Push subscriptions
      console.log('\nPush subscriptions:');
      const psResult = await call('/functions/v1/dev-admin', { action: 'get_push_subscriptions' });
      const subs = psResult.body.data || [];
      console.log(`  Total: ${subs.length}`);
      for (const s of subs) {
        console.log(`  event_id=${s.event_id} | endpoint=${s.endpoint.substring(0,50)}...`);
      }
    } else {
      console.log('  ❌ Failed:', JSON.stringify(result.body));
    }
    return;
  }

  if (ACTION === 'test_submit') {
    const nanoid = process.argv[3] || '8DwHXmGTIC';
    const isPremium = process.argv[4] === 'premium';
    console.log(`\nTesting submit-wish for nanoid: ${nanoid}`);
    const result = await call('/functions/v1/submit-wish', {
      wedding_nanoid: nanoid,
      fullname: 'VERIFY_TEST_' + Date.now(),
      father_fullname: 'Test Father',
      ...(isPremium ? { phone_number: '9999999999' } : {}),
      amount: 1,
      payment_type: 'Cash',
      gift_side: 'bride',
      village: 'TestVillage',
      wish: 'Automated E2E test',
    }, {});
    console.log(`  Status: ${result.status}`);
    console.log(`  Body: ${JSON.stringify(result.body).substring(0, 500)}`);
    if (result.status === 200) {
      console.log('  ✅ submit-wish succeeded! Push notification should have been dispatched.');
    } else {
      console.log('  ❌ submit-wish failed');
    }
    return;
  }

  console.log('Usage:');
  console.log('  node call_admin.cjs patch_dev_weddings');
  console.log('  node call_admin.cjs get_state');
  console.log('  node call_admin.cjs test_submit [nanoid]');
}

main().catch(console.error);
