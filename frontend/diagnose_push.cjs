/**
 * diagnose_push.cjs - Run from: r:\WedTracks\WedTrack\frontend
 * node diagnose_push.cjs
 */

const { createClient } = require('./node_modules/@supabase/supabase-js');

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
  try { await fn(); } catch(e) { console.error(`  UNHANDLED: ${e.message}`); }
}

async function main() {

  // 1: push_subscriptions table
  await section('1: push_subscriptions table', async () => {
    const { data, error } = await anonClient.from('push_subscriptions').select('id').limit(1);
    if (error?.code === '42P01') {
      console.log('  ❌ TABLE DOES NOT EXIST!');
    } else if (error) {
      console.log(`  ✅ Table exists (RLS blocks anon: ${error.code} - ${error.message})`);
    } else {
      console.log(`  ✅ Table accessible, rows: ${data?.length}`);
    }
  });

  // 2: Weddings timing
  await section('2: Weddings timing state', async () => {
    const { data: weddings, error } = await anonClient
      .from('weddings')
      .select('id, nanoid, payment_status, qr_activation_time, qr_expires_at, selected_plan')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) { console.error(`  ❌ ${error.message}`); return; }
    const now = new Date();
    console.log(`  UTC now: ${now.toISOString()}\n`);
    
    const issues = [];
    for (const w of (weddings || [])) {
      const activTime = w.qr_activation_time ? new Date(w.qr_activation_time + (w.qr_activation_time.includes('+') ? '' : 'Z')) : null;
      const expiresAt = w.qr_expires_at ? new Date(w.qr_expires_at) : null;
      
      let status, issue;
      if (activTime && now < activTime) {
        const minUntil = Math.round((activTime - now) / 60000);
        status = `⏳ FUTURE (${minUntil}min until active)`;
        issue = 'future_activation';
      } else if (expiresAt && now > expiresAt) {
        const minAgo = Math.round((now - expiresAt) / 60000);
        status = `⌛ EXPIRED (${minAgo}min ago)`;
        issue = 'expired';
      } else {
        status = '✅ ACTIVE';
      }
      
      console.log(`  ${status} | ${w.nanoid} | pay=${w.payment_status} | plan=${w.selected_plan}`);
      if (issue && w.payment_status === 'paid') issues.push({ ...w, issue });
    }

    if (issues.length > 0) {
      console.log(`\n  🔧 DEV FIX SQL (run via Supabase Dashboard > SQL Editor):`);
      console.log(`  --------------------------------------------------------`);
      for (const w of issues) {
        console.log(`  -- Fix ${w.nanoid} (${w.issue}):`);
        console.log(`  UPDATE public.weddings`);
        console.log(`    SET qr_activation_time = now() - interval '1 day',`);
        console.log(`        qr_expires_at = now() + interval '7 days'`);
        console.log(`    WHERE id = '${w.id}';\n`);
      }
    }
  });

  // 3: Function reachability
  await section('3: send-push-notification auth guard', async () => {
    try {
      const r = await fetchWithTimeout(`${DEV_URL}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-key': 'WRONG' },
        body: JSON.stringify({ event_id: '00000000-0000-0000-0000-000000000000' })
      });
      const body = await r.text();
      console.log(`  Status: ${r.status} | Body: ${body}`);
      if (r.status === 403) console.log('  ✅ Auth guard OK');
      else console.log('  ⚠️  Unexpected response');
    } catch(e) { console.error(`  ❌ ${e.message}`); }
  });

  await section('4: save-push-subscription CORS', async () => {
    try {
      const r = await fetchWithTimeout(`${DEV_URL}/functions/v1/save-push-subscription`, {
        method: 'OPTIONS',
        headers: { 'Origin': 'http://localhost:5173' }
      });
      console.log(`  Status: ${r.status} | CORS: ${r.headers.get('access-control-allow-origin')}`);
      if (r.status === 200) console.log('  ✅ CORS OK');
    } catch(e) { console.error(`  ❌ ${e.message}`); }
  });

  // 4: VAPID key
  await section('5: VAPID public key', async () => {
    const key = VAPID_PUBLIC;
    const padding = '='.repeat((4 - (key.length % 4)) % 4);
    const raw = Buffer.from((key + padding).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    console.log(`  Length: ${key.length} chars | Decoded: ${raw.length} bytes | First: 0x${raw[0].toString(16)}`);
    if (raw.length === 65 && raw[0] === 0x04) console.log('  ✅ Valid P-256 uncompressed key');
    else console.error('  ❌ INVALID VAPID KEY');
  });

  // 5: E2E submit test
  await section('6: submit-wish E2E test', async () => {
    const { data: weddings } = await anonClient
      .from('weddings')
      .select('id, nanoid, payment_status, qr_activation_time, qr_expires_at, selected_plan')
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });
    
    const now = new Date();
    const active = (weddings || []).find(w => {
      const activTime = w.qr_activation_time ? new Date(w.qr_activation_time + (w.qr_activation_time.includes('+') ? '' : 'Z')) : null;
      const expiresAt = w.qr_expires_at ? new Date(w.qr_expires_at) : null;
      return (!activTime || now >= activTime) && (!expiresAt || now <= expiresAt);
    });

    if (!active) {
      console.log('  ❌ No active wedding found — fix timing first');
      return;
    }

    console.log(`  Testing with: ${active.nanoid} (plan=${active.selected_plan})`);
    const isBasic = !['premium', '349', 'pro'].includes(active.selected_plan);
    
    const testBody = {
      wedding_nanoid: active.nanoid,
      fullname: 'PUSH_DIAG_' + Date.now(),
      father_fullname: 'Diagnostic Father',
      ...(!isBasic ? { phone_number: '9999999999' } : {}),
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
      console.log(`  Body: ${body.substring(0, 400)}`);
      if (r.status === 200) {
        console.log('  ✅ submit-wish OK — push dispatch should have fired');
        console.log('  📋 Check Supabase Dashboard > Edge Functions > send-push-notification > Logs');
      } else {
        console.log(`  ❌ Failed: check the body above`);
      }
    } catch(e) { console.error(`  ❌ ${e.message}`); }
  });

  console.log('\n' + '='.repeat(60));
  console.log('  DIAGNOSTIC COMPLETE');
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
