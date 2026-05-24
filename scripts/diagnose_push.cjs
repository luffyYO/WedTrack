/**
 * diagnose_push.cjs - CommonJS compatible diagnostic script
 * Run from: r:\WedTracks\WedTrack\frontend
 * node ../scripts/diagnose_push.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const DEV_URL = 'https://vplasmjfvhzcjpfpebvy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGFzbWpmdmh6Y2pwZnBlYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDc0MzIsImV4cCI6MjA4OTkyMzQzMn0.4rbX2DwG0ABFtXYq-_FNRUkpKNR8D9qzlikglJB4Wto';
const VAPID_PUBLIC = 'BC5RxkDoZ-DZSV1Y6QxoEHX_BV9Me8FdBPd17rTtTaCI1JYW3Kgt2sFyJaYtBxoHo2LCIuJX0gn98HnSiZF0jy0';

const anonClient = createClient(DEV_URL, ANON_KEY);

const TIMEOUT_MS = 20000;

async function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    return r;
  } catch(e) {
    clearTimeout(timer);
    throw e;
  }
}

async function section(title, fn) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
  try {
    await fn();
  } catch(e) {
    console.error(`  UNHANDLED ERROR: ${e.message}`);
  }
}

async function main() {
  // ── 1: push_subscriptions table existence ─────────────────────────────────
  await section('1: push_subscriptions table', async () => {
    const { data, error } = await anonClient
      .from('push_subscriptions')
      .select('id')
      .limit(1);
    
    if (error?.code === '42P01') {
      console.log('  ❌ TABLE DOES NOT EXIST!');
    } else if (error) {
      // Most likely PGRST116 or RLS violation — table exists but blocked
      console.log(`  ✅ Table exists (anon blocked by RLS as expected: ${error.code})`);
    } else {
      console.log(`  ✅ Table accessible, rows returned: ${data?.length ?? 0}`);
    }
  });

  // ── 2: Weddings state ────────────────────────────────────────────────────
  await section('2: Weddings timing state', async () => {
    const { data: weddings, error } = await anonClient
      .from('weddings')
      .select('id, nanoid, payment_status, qr_activation_time, qr_expires_at, selected_plan')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) { console.error(`  ❌ Error: ${error.message}`); return; }

    const now = new Date();
    console.log(`  UTC now: ${now.toISOString()}`);
    console.log('');
    
    const issues = [];
    (weddings || []).forEach(w => {
      const activTime = w.qr_activation_time ? new Date(w.qr_activation_time) : null;
      const expiresAt = w.qr_expires_at ? new Date(w.qr_expires_at) : null;
      
      let status, issue;
      if (activTime && now < activTime) {
        const minUntil = Math.round((activTime - now) / 60000);
        status = `⏳ NOT YET (activates in ${minUntil}min UTC)`;
        issue = 'future_activation';
      } else if (expiresAt && now > expiresAt) {
        status = '⌛ EXPIRED';
        issue = 'expired';
      } else {
        status = '✅ ACTIVE';
      }
      
      console.log(`  ${status}`);
      console.log(`     nanoid=${w.nanoid} | id=${w.id}`);
      console.log(`     payment=${w.payment_status} | plan=${w.selected_plan}`);
      console.log(`     activation=${w.qr_activation_time} | expires=${w.qr_expires_at}`);
      
      if (issue && w.payment_status === 'paid') {
        issues.push({ ...w, issue });
      }
    });

    if (issues.length > 0) {
      console.log(`\n  ⚠️  DEV FIX NEEDED for ${issues.length} wedding(s):`);
      issues.forEach(w => {
        console.log(`     FIX: nanoid=${w.nanoid} reason=${w.issue}`);
        console.log(`     SQL: UPDATE weddings SET qr_activation_time=now()-interval'1 day', qr_expires_at=now()+interval'7 days' WHERE id='${w.id}';`);
      });
    }
  });

  // ── 3: Edge function reachability ────────────────────────────────────────
  await section('3: send-push-notification reachability', async () => {
    try {
      const r = await fetchWithTimeout(`${DEV_URL}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-key': 'INTENTIONALLY_WRONG' },
        body: JSON.stringify({ event_id: '00000000-0000-0000-0000-000000000000' })
      });
      const body = await r.text();
      console.log(`  HTTP Status: ${r.status}`);
      console.log(`  Body: ${body}`);
      if (r.status === 403) {
        console.log('  ✅ Auth guard working correctly (403 for wrong key)');
      } else {
        console.log('  ⚠️  Unexpected response');
      }
    } catch(e) {
      console.error(`  ❌ Network error: ${e.message}`);
    }
  });

  await section('4: save-push-subscription OPTIONS/CORS', async () => {
    try {
      const r = await fetchWithTimeout(`${DEV_URL}/functions/v1/save-push-subscription`, {
        method: 'OPTIONS',
        headers: { 'Origin': 'http://localhost:5173' }
      });
      console.log(`  HTTP Status: ${r.status}`);
      console.log(`  CORS Origin: ${r.headers.get('access-control-allow-origin') || 'NOT SET'}`);
      if (r.status === 200) console.log('  ✅ CORS working');
    } catch(e) {
      console.error(`  ❌ ${e.message}`);
    }
  });

  // ── 4: VAPID key validation ───────────────────────────────────────────────
  await section('5: VAPID public key validation', async () => {
    const key = VAPID_PUBLIC;
    const padding = '='.repeat((4 - (key.length % 4)) % 4);
    const b64 = (key + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = Buffer.from(b64, 'base64');
    console.log(`  Key length: ${key.length} chars`);
    console.log(`  Decoded: ${raw.length} bytes (expected 65)`);
    console.log(`  First byte: 0x${raw[0].toString(16)} (expected 0x04 = uncompressed P-256)`);
    if (raw.length === 65 && raw[0] === 0x04) {
      console.log('  ✅ VAPID public key valid');
    } else {
      console.error('  ❌ VAPID public key INVALID');
    }
  });

  // ── 5: submit-wish with active wedding ───────────────────────────────────
  await section('6: submit-wish end-to-end test', async () => {
    const { data: weddings } = await anonClient
      .from('weddings')
      .select('id, nanoid, payment_status, qr_activation_time, qr_expires_at, selected_plan')
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });
    
    const now = new Date();
    const active = (weddings || []).find(w => {
      const activTime = w.qr_activation_time ? new Date(w.qr_activation_time) : null;
      const expiresAt = w.qr_expires_at ? new Date(w.qr_expires_at) : null;
      return (!activTime || now >= activTime) && (!expiresAt || now <= expiresAt);
    });

    if (!active) {
      console.log('  ❌ No active wedding — timing fix required before this test can run');
      return;
    }

    console.log(`  Using wedding: nanoid=${active.nanoid}, plan=${active.selected_plan}`);
    
    const isBasic = active.selected_plan !== 'premium' && active.selected_plan !== '349' && active.selected_plan !== 'pro';
    const testBody = {
      wedding_nanoid: active.nanoid,
      fullname: 'PUSH_DIAG_TEST',
      father_fullname: 'Diagnostic Father',
      ...(isBasic ? {} : { phone_number: '9999999999' }),
      amount: 0,
      payment_type: 'Cash',
      gift_side: 'bride',
      village: 'DiagVillage',
      wish: 'Push diagnostic test'
    };

    try {
      const r = await fetchWithTimeout(`${DEV_URL}/functions/v1/submit-wish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testBody)
      });
      const body = await r.text();
      console.log(`  Status: ${r.status}`);
      console.log(`  Response: ${body.substring(0, 300)}`);
      if (r.status === 200) {
        console.log('  ✅ submit-wish succeeded');
        console.log('  📋 Check Supabase Edge Function logs for push dispatch result');
      } else {
        console.log(`  ❌ Failed: ${r.status}`);
      }
    } catch(e) {
      console.error(`  ❌ ${e.message}`);
    }
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log('  DIAGNOSTIC COMPLETE');
  console.log('='.repeat(60));
}

main().catch(console.error);
