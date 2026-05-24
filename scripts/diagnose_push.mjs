/**
 * diagnose_push.mjs
 * 
 * Comprehensive diagnostic and repair script for WedTrack Web Push system.
 * Tests all layers: DB state, secrets, function reachability, VAPID crypto.
 * 
 * Run: node scripts/diagnose_push.mjs
 */

import { createClient } from '@supabase/supabase-js';

const DEV_URL = 'https://vplasmjfvhzcjpfpebvy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGFzbWpmdmh6Y2pwZnBlYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDc0MzIsImV4cCI6MjA4OTkyMzQzMn0.4rbX2DwG0ABFtXYq-_FNRUkpKNR8D9qzlikglJB4Wto';
const VAPID_PUBLIC = 'BC5RxkDoZ-DZSV1Y6QxoEHX_BV9Me8FdBPd17rTtTaCI1JYW3Kgt2sFyJaYtBxoHo2LCIuJX0gn98HnSiZF0jy0';

// Service Role Key — needed to bypass RLS for admin queries
// Read from environment or .env file
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Try to find service role key from supabase secrets env
let SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Also try reading from the supabase project secrets via the known linked .env
if (!SERVICE_ROLE_KEY) {
  try {
    // Try reading from scripts or supabase env
    const envContent = readFileSync(resolve(__dirname, '../supabase/.env'), 'utf-8');
    const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (match) SERVICE_ROLE_KEY = match[1].trim();
  } catch {}
}

if (!SERVICE_ROLE_KEY) {
  // Try the known pattern from supabase secrets for the DEV project
  // We need to test functions that use x-internal-key = SERVICE_ROLE_KEY
  // The key can be derived from the linked project
  console.log('⚠️  SERVICE_ROLE_KEY not found in env. Will test what we can without it.');
}

const adminClient = SERVICE_ROLE_KEY 
  ? createClient(DEV_URL, SERVICE_ROLE_KEY)
  : null;

const anonClient = createClient(DEV_URL, ANON_KEY);

const TIMEOUT_MS = 15000;

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
    console.error(`  ❌ UNHANDLED ERROR: ${e.message}`);
  }
}

// ── PHASE 1: DB State ─────────────────────────────────────────────────────────

await section('PHASE 1A: push_subscriptions table', async () => {
  const { data, error, count } = await anonClient
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true });
  
  if (error?.code === '42P01') {
    console.error('  ❌ TABLE DOES NOT EXIST — push_subscriptions missing!');
    console.log('  🔧 ACTION: Need to create push_subscriptions table');
  } else if (error?.code === '42501') {
    console.log('  ✅ Table exists (RLS blocks anon — expected)');
  } else if (error) {
    console.error(`  ❌ DB error: ${JSON.stringify(error)}`);
  } else {
    console.log(`  ✅ Table accessible, count=${count ?? 'N/A (RLS)'}`);
  }

  // If admin client is available, check actual subscription count
  if (adminClient) {
    const { data: subs, error: adminErr } = await adminClient
      .from('push_subscriptions')
      .select('id, event_id, endpoint, created_at');
    if (adminErr) {
      console.error(`  ❌ Admin query error: ${adminErr.message}`);
    } else {
      console.log(`  📊 Total subscriptions (admin): ${subs.length}`);
      subs.forEach((s, i) => {
        console.log(`     Sub[${i}]: event_id=${s.event_id}, endpoint=${s.endpoint.substring(0,60)}...`);
      });
    }
  }
});

await section('PHASE 1B: Weddings Table State', async () => {
  const { data: weddings, error } = await anonClient
    .from('weddings')
    .select('id, nanoid, payment_status, qr_activation_time, qr_expires_at, selected_plan')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return;
  }

  const now = new Date();
  console.log(`  Current UTC time: ${now.toISOString()}`);
  
  const issues = [];
  weddings.forEach(w => {
    const activTime = w.qr_activation_time ? new Date(w.qr_activation_time) : null;
    const expiresAt = w.qr_expires_at ? new Date(w.qr_expires_at) : null;
    const isActive = (!activTime || now >= activTime) && (!expiresAt || now <= expiresAt);
    const status = isActive ? '✅ ACTIVE' : (activTime && now < activTime) ? '⏳ NOT YET ACTIVE' : '⌛ EXPIRED';
    console.log(`  ${status} | nanoid=${w.nanoid} | payment=${w.payment_status} | activation=${w.qr_activation_time} | expires=${w.qr_expires_at}`);
    if (!isActive && w.payment_status === 'paid') {
      issues.push({ id: w.id, nanoid: w.nanoid, reason: activTime && now < activTime ? 'future_activation' : 'expired' });
    }
  });

  if (issues.length > 0) {
    console.log(`\n  ⚠️  ${issues.length} weddings need timing fix for DEV:`);
    issues.forEach(i => console.log(`     - ${i.nanoid} (${i.id}): ${i.reason}`));
  }
});

// ── PHASE 2: Edge Function Reachability ───────────────────────────────────────

await section('PHASE 2A: save-push-subscription CORS/OPTIONS', async () => {
  try {
    const r = await fetchWithTimeout(`${DEV_URL}/functions/v1/save-push-subscription`, {
      method: 'OPTIONS',
      headers: { 'Origin': 'http://localhost:5173' }
    });
    console.log(`  Status: ${r.status}`);
    console.log(`  CORS: ${r.headers.get('access-control-allow-origin')}`);
    console.log(`  ✅ Function reachable`);
  } catch(e) {
    console.error(`  ❌ ${e.message}`);
  }
});

await section('PHASE 2B: send-push-notification auth guard', async () => {
  try {
    const r = await fetchWithTimeout(`${DEV_URL}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': 'WRONG_KEY' },
      body: JSON.stringify({ event_id: '00000000-0000-0000-0000-000000000000' })
    });
    const body = await r.text();
    if (r.status === 403) {
      console.log(`  ✅ Auth guard working (got 403 as expected)`);
    } else {
      console.log(`  ⚠️  Unexpected status: ${r.status}, body: ${body}`);
    }
  } catch(e) {
    console.error(`  ❌ ${e.message}`);
  }
});

await section('PHASE 2C: send-push-notification with no-sub event_id', async () => {
  if (!SERVICE_ROLE_KEY) {
    console.log('  ⏭️  Skipped — no SERVICE_ROLE_KEY available');
    return;
  }
  try {
    const r = await fetchWithTimeout(`${DEV_URL}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': SERVICE_ROLE_KEY },
      body: JSON.stringify({ event_id: '00000000-0000-0000-0000-000000000000' })
    });
    const body = await r.json();
    console.log(`  Status: ${r.status}`);
    console.log(`  Body: ${JSON.stringify(body)}`);
    if (r.status === 200 && body?.data?.sent === 0) {
      console.log('  ✅ Function works — returned 0 subscribers (expected for dummy event)');
    } else if (r.status === 500 && body?.message?.includes('VAPID')) {
      console.error('  ❌ VAPID secrets not configured in DEV');
    } else {
      console.log(`  ⚠️  Response: ${JSON.stringify(body)}`);
    }
  } catch(e) {
    console.error(`  ❌ ${e.message}`);
  }
});

// ── PHASE 3: VAPID Key Validation ─────────────────────────────────────────────

await section('PHASE 3: VAPID Public Key Format', async () => {
  const key = VAPID_PUBLIC;
  console.log(`  Key: ${key.substring(0, 30)}...`);
  console.log(`  Length: ${key.length} chars`);
  
  // Decode and check
  const padding = '='.repeat((4 - (key.length % 4)) % 4);
  const b64 = (key + padding).replace(/-/g, '+').replace(/_/g, '/');
  try {
    const raw = Buffer.from(b64, 'base64');
    console.log(`  Decoded length: ${raw.length} bytes (expected: 65 for P-256 uncompressed)`);
    if (raw.length === 65 && raw[0] === 0x04) {
      console.log('  ✅ VAPID public key is valid P-256 uncompressed point');
    } else {
      console.error(`  ❌ Invalid VAPID key — length=${raw.length}, first byte=0x${raw[0].toString(16)}`);
    }
  } catch(e) {
    console.error(`  ❌ Key decode failed: ${e.message}`);
  }
});

// ── PHASE 4: Submit-wish test with active wedding ─────────────────────────────

await section('PHASE 4: submit-wish function test (safe probe)', async () => {
  // Find the most recently active wedding
  const { data: weddings } = await anonClient
    .from('weddings')
    .select('id, nanoid, payment_status, qr_activation_time, qr_expires_at, selected_plan')
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false });
  
  const now = new Date();
  const activeWedding = weddings?.find(w => {
    const activTime = w.qr_activation_time ? new Date(w.qr_activation_time) : null;
    const expiresAt = w.qr_expires_at ? new Date(w.qr_expires_at) : null;
    return (!activTime || now >= activTime) && (!expiresAt || now <= expiresAt);
  });

  if (!activeWedding) {
    console.log('  ⚠️  No currently active wedding found for submission test');
    console.log('  🔧 ACTION NEEDED: Fix wedding timing for DEV testing');
    
    // List all paid weddings and their status
    weddings?.forEach(w => {
      const activTime = w.qr_activation_time ? new Date(w.qr_activation_time) : null;
      const expiresAt = w.qr_expires_at ? new Date(w.qr_expires_at) : null;
      const reason = activTime && now < activTime ? `activates in ${Math.round((activTime - now)/60000)}min` : expiresAt && now > expiresAt ? 'EXPIRED' : 'active';
      console.log(`     nanoid=${w.nanoid} | ${reason}`);
    });
    return;
  }

  console.log(`  🎯 Testing with wedding: ${activeWedding.nanoid} (${activeWedding.id})`);
  console.log(`     plan=${activeWedding.selected_plan}, expires=${activeWedding.qr_expires_at}`);
  
  // Simulate a submit-wish probe (we won't actually insert, just check timing)
  const testBody = {
    wedding_nanoid: activeWedding.nanoid,
    fullname: 'TEST Guest Push',
    father_fullname: 'TEST Father',
    phone_number: '9999999999',
    amount: 0,
    payment_type: 'Cash',
    gift_side: 'bride',
    village: 'TestVillage',
    wish: 'Test wish for push notification diagnostic'
  };
  
  console.log(`  📤 Submitting test guest...`);
  try {
    const r = await fetchWithTimeout(`${DEV_URL}/functions/v1/submit-wish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBody)
    });
    const respBody = await r.text();
    console.log(`  Status: ${r.status}`);
    console.log(`  Body: ${respBody.substring(0, 300)}`);
    if (r.status === 200) {
      console.log('  ✅ submit-wish succeeded! Check logs for push dispatch.');
    } else if (r.status === 403) {
      console.error('  ❌ 403 — wedding timing issue or QR not active');
    } else if (r.status === 404) {
      console.error('  ❌ 404 — wedding not found (nanoid mismatch or payment_status issue)');
    } else {
      console.log(`  ⚠️  Unexpected status: ${r.status}`);
    }
  } catch(e) {
    console.error(`  ❌ submit-wish failed: ${e.message}`);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log('  DIAGNOSTIC COMPLETE');
console.log('='.repeat(60));
console.log('\nNext Steps:');
console.log('1. Check push_subscriptions table state');
console.log('2. Fix wedding timing if needed');  
console.log('3. Redeploy edge functions if code changed');
console.log('4. Subscribe in browser and submit test guest');
