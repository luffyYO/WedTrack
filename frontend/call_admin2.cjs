/**
 * Enhanced admin call script for DEV auditing and patching.
 * Run: node call_admin2.cjs <action>
 */
const https = require('https');

const DEV_URL = 'vplasmjfvhzcjpfpebvy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGFzbWpmdmh6Y2pwZnBlYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDc0MzIsImV4cCI6MjA4OTkyMzQzMn0.4rbX2DwG0ABFtXYq-_FNRUkpKNR8D9qzlikglJB4Wto';
const DEV_ADMIN_TOKEN = 'wedtrack-dev-admin-2026';

const ACTION = process.argv[2] || 'vapid_check';

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
        'x-internal-key': DEV_ADMIN_TOKEN,
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

function callPost(path, body, extraHeaders = {}) {
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
  console.log('='.repeat(70));
  console.log(`WedTrack DEV Audit — ${now.toISOString()}`);
  console.log(`Action: ${ACTION}`);
  console.log('='.repeat(70));

  if (ACTION === 'vapid_check') {
    console.log('\n[VAPID Config Check]');
    const result = await callAdmin('get_vapid_config');
    console.log(`  Status: ${result.status}`);
    if (result.status === 200) {
      const cfg = result.body;
      console.log(`  VAPID_PRIVATE_KEY present: ${cfg.VAPID_PRIVATE_KEY_present} (${cfg.VAPID_PRIVATE_KEY_length} chars)`);
      console.log(`  VAPID_PUBLIC_KEY prefix:   ${cfg.VAPID_PUBLIC_KEY_prefix}... (${cfg.VAPID_PUBLIC_KEY_length} chars)`);
      console.log(`  VITE_VAPID_PUBLIC_KEY:     ${cfg.VITE_VAPID_PUBLIC_KEY_length > 0 ? cfg.VITE_VAPID_PUBLIC_KEY_prefix + '...' : 'NOT SET'}`);
      console.log(`  VAPID_SUBJECT:             ${cfg.VAPID_SUBJECT}`);
      console.log(`  Resolved public key:       ${cfg.resolved_public_key_prefix}...`);
      console.log(`\n  FRONTEND VITE_VAPID_PUBLIC_KEY: BC5RxkDoZ-DZSV1Y6Q... (from .env.local)`);
      
      // Check if they match
      const backendPrefix = cfg.resolved_public_key_prefix;
      const frontendPrefix = 'BC5RxkDoZ-DZSV1Y6Q';
      if (backendPrefix === frontendPrefix) {
        console.log('  ✅ VAPID keys MATCH between backend and frontend!');
      } else {
        console.log(`  ❌ VAPID key MISMATCH!`);
        console.log(`     Backend uses:  ${backendPrefix}...`);
        console.log(`     Frontend uses: ${frontendPrefix}...`);
        console.log('  FIX: Set VAPID_PUBLIC_KEY secret to match VITE_VAPID_PUBLIC_KEY in .env.local');
      }
    } else {
      console.log('  ❌ Failed:', JSON.stringify(result.body));
    }
    return;
  }

  if (ACTION === 'fix_subscription_event_id') {
    const newEventId = process.argv[3] || 'cc8378e6-61b8-4c20-8262-41381c9e7902';
    const oldEventId = process.argv[4];
    console.log(`\n[Fix Push Subscription event_id → ${newEventId}]`);
    const result = await callAdmin('patch_push_subscription_event_id', {
      new_event_id: newEventId,
      ...(oldEventId ? { old_event_id: oldEventId } : {}),
    });
    console.log(`  Status: ${result.status}`);
    if (result.status === 200) {
      const updated = result.body.updated || [];
      console.log(`  ✅ Updated ${updated.length} subscription(s)`);
      for (const s of updated) {
        console.log(`     endpoint: ${s.endpoint.substring(0, 60)}...`);
        console.log(`     event_id: ${s.event_id}`);
      }
    } else {
      console.log('  ❌ Failed:', JSON.stringify(result.body));
    }
    return;
  }

  if (ACTION === 'delete_stale') {
    console.log('\n[Delete Stale Push Subscriptions]');
    const result = await callAdmin('delete_stale_push_subscriptions');
    console.log(`  Status: ${result.status}`);
    console.log(`  Result: ${JSON.stringify(result.body)}`);
    return;
  }

  if (ACTION === 'full_audit') {
    // Step 1: VAPID config
    console.log('\n[1/4] VAPID Configuration:');
    const vapidResult = await callAdmin('get_vapid_config');
    if (vapidResult.status === 200) {
      const cfg = vapidResult.body;
      const backendPrefix = cfg.resolved_public_key_prefix;
      const frontendPrefix = 'BC5RxkDoZ-DZSV1Y6Q';
      const match = backendPrefix === frontendPrefix;
      console.log(`  VAPID_PRIVATE_KEY: ${cfg.VAPID_PRIVATE_KEY_present ? '✅ present' : '❌ MISSING'}`);
      console.log(`  Backend public key prefix: ${backendPrefix}`);
      console.log(`  Frontend public key prefix: ${frontendPrefix}`);
      console.log(`  Keys match: ${match ? '✅' : '❌ MISMATCH'}`);
      console.log(`  VAPID_SUBJECT: ${cfg.VAPID_SUBJECT}`);
    }

    // Step 2: Wedding state
    console.log('\n[2/4] Wedding State:');
    const stateResult = await callAdmin('get_weddings_state');
    if (stateResult.status === 200) {
      const weddings = stateResult.body.data || [];
      const now2 = new Date();
      let activeWeddingId = null;
      let activeNanoid = null;
      for (const w of weddings) {
        const exp = w.qr_expires_at ? new Date(w.qr_expires_at) : null;
        const act = w.qr_activation_time ? new Date(w.qr_activation_time) : null;
        const isActive = w.payment_status === 'paid' && (!act || now2 >= act) && (!exp || now2 <= exp);
        const status = isActive ? '✅ACTIVE' : 'INACTIVE';
        if (isActive && !activeWeddingId) {
          activeWeddingId = w.id;
          activeNanoid = w.nanoid;
        }
        console.log(`  ${status.padEnd(12)} | ${(w.nanoid||'NO_NID').padEnd(12)} | ${w.payment_status}`);
      }
      if (activeWeddingId) {
        console.log(`\n  Primary active wedding: ${activeNanoid} (${activeWeddingId})`);
      } else {
        console.log('  ❌ No active weddings! Run: node call_admin.cjs patch_dev_weddings');
      }
    }

    // Step 3: Push subscriptions
    console.log('\n[3/4] Push Subscriptions:');
    const subsResult = await callAdmin('get_push_subscriptions');
    if (subsResult.status === 200) {
      const subs = subsResult.body.data || [];
      console.log(`  Total subscriptions: ${subs.length}`);
      
      const stateResult2 = await callAdmin('get_weddings_state');
      const now3 = new Date();
      const activeIds = new Set((stateResult2.body.data || [])
        .filter(w => {
          const exp = w.qr_expires_at ? new Date(w.qr_expires_at) : null;
          const act = w.qr_activation_time ? new Date(w.qr_activation_time) : null;
          return w.payment_status === 'paid' && (!act || now3 >= act) && (!exp || now3 <= exp);
        })
        .map(w => w.id));

      for (const s of subs) {
        const isForActive = activeIds.has(s.event_id);
        console.log(`  ${isForActive ? '✅' : '⚠️ STALE'} event_id=${s.event_id}`);
        console.log(`         endpoint=${s.endpoint.substring(0, 60)}...`);
      }

      if (subs.length === 0) {
        console.log('  ⚠️ No push subscriptions — user must grant permission on dashboard');
      }
    }

    // Step 4: Test submit-wish
    console.log('\n[4/4] submit-wish E2E Test:');
    const testResult = await callPost('/functions/v1/submit-wish', {
      wedding_nanoid: 'cc8378e6-61b8-4c20-8262-41381c9e7902' === 'cc8378e6' ? '8DwHXmGTIC' : '8DwHXmGTIC',
      fullname: 'AUDIT_TEST_' + Date.now(),
      father_fullname: 'Audit Father',
      amount: 0,
      payment_type: 'Cash',
      gift_side: 'bride',
      village: 'AuditVillage',
      wish: 'Full audit test',
    });
    console.log(`  Status: ${testResult.status}`);
    if (testResult.status === 200) {
      console.log(`  ✅ submit-wish OK | guest_id: ${testResult.body.data?.id}`);
    } else {
      console.log(`  ❌ Failed: ${JSON.stringify(testResult.body)}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('AUDIT COMPLETE');
    console.log('='.repeat(70));
    return;
  }

  console.log('Usage:');
  console.log('  node call_admin2.cjs vapid_check');
  console.log('  node call_admin2.cjs fix_subscription_event_id [new_event_id] [old_event_id]');
  console.log('  node call_admin2.cjs delete_stale');
  console.log('  node call_admin2.cjs full_audit');
}

main().catch(console.error);
