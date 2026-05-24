/**
 * fix_dev_weddings.cjs
 * 
 * Patches DEV wedding rows so they're usable for testing:
 * - Sets qr_activation_time to past
 * - Extends qr_expires_at to 7 days from now
 * 
 * Uses Supabase service role key via the admin edge function debug-db
 * or via direct REST admin API.
 * 
 * Run from: r:\WedTracks\WedTrack\frontend
 * node fix_dev_weddings.cjs
 */

const { createClient } = require('./node_modules/@supabase/supabase-js');

const DEV_URL = 'https://vplasmjfvhzcjpfpebvy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGFzbWpmdmh6Y2pwZnBlYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDc0MzIsImV4cCI6MjA4OTkyMzQzMn0.4rbX2DwG0ABFtXYq-_FNRUkpKNR8D9qzlikglJB4Wto';

// IDs that need fixing (from diagnostic):
// tCfEFhdZRo - future activation (the main DEV wedding)
// ZTI0AizwOU, P5-oTNTmgk, fc_OPYpTHh, 3Pms7Pg8uV, 041RUJrPQY - expired
const WEDDING_IDS_TO_FIX = [
  '53736a98-b117-46ed-a4a1-8bf87bdcc9da',  // tCfEFhdZRo (future)
  'c4fc36cc-7964-40ab-a18e-c033af5fe19d',  // ZTI0AizwOU (expired)
  'e242b22d-aed4-4f1d-8556-eabc2dd1039d',  // fc_OPYpTHh (just expired)
  '8c5e907e-c3d3-443b-ab7e-34570e689e77',  // P5-oTNTmgk (expired)
  '4a49934d-a941-4e0f-b206-ed1313c62131',  // 3Pms7Pg8uV (expired)
  'e3c9fdd1-24f9-4c91-8abe-08c9d62d08d9',  // 041RUJrPQY (expired)
];

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

async function main() {
  console.log('WedTrack DEV Wedding Timing Fixer');
  console.log('==================================\n');
  
  // Use the debug-db edge function to run SQL directly
  // This function requires JWT (verify_jwt=true per config.toml)
  // Instead, we'll use the admin REST API pattern — update via the
  // supabase-js anon client with special override, which won't work for RLS-protected tables.
  
  // Since we can't run raw SQL via API without service role key,
  // we'll use the Supabase Management REST API via the linked access token.
  // OR: We'll use the extend-wedding function if it accepts admin patches.
  
  // Best approach: Use fetch to call the Management API or use the db-setup function.
  // Actually the cleanest approach is to write the SQL and call debug-db function.
  
  // First let's check if debug-db is available and what it accepts
  const anonClient = createClient(DEV_URL, ANON_KEY);
  
  // Check weddings state before fix
  const { data: before } = await anonClient
    .from('weddings')
    .select('id, nanoid, qr_activation_time, qr_expires_at, payment_status')
    .in('id', WEDDING_IDS_TO_FIX);
  
  console.log('Before fix:');
  (before || []).forEach(w => {
    const now = new Date();
    const activTime = w.qr_activation_time ? new Date(w.qr_activation_time + (w.qr_activation_time.includes('+') ? '' : 'Z')) : null;
    const expiresAt = w.qr_expires_at ? new Date(w.qr_expires_at) : null;
    const isActive = (!activTime || now >= activTime) && (!expiresAt || now <= expiresAt);
    console.log(`  ${isActive ? '✅' : '❌'} ${w.nanoid} | activation=${w.qr_activation_time} | expires=${w.qr_expires_at}`);
  });

  // Try updating via supabase REST (will be blocked by RLS unless service role)
  // So we use the debug-db function which has JWT required
  // Instead let's try the pg REST endpoint with service role

  // Generate the SQL payload for debug-db function
  const fixSql = WEDDING_IDS_TO_FIX.map(id => 
    `UPDATE public.weddings SET qr_activation_time = NOW() - INTERVAL '1 day', qr_expires_at = NOW() + INTERVAL '7 days', payment_status = 'paid' WHERE id = '${id}' AND payment_status = 'paid';`
  ).join('\n');

  console.log('\nSQL to execute:');
  console.log(fixSql);
  
  // Try calling debug-db function (it requires auth JWT)
  // We'll make a request to see if it's accessible without auth first
  try {
    const r = await fetchWithTimeout(`${DEV_URL}/functions/v1/debug-db`, {
      method: 'OPTIONS'
    });
    console.log(`\ndebug-db OPTIONS: ${r.status}`);
  } catch(e) {
    console.error(`debug-db unreachable: ${e.message}`);
  }

  // The most reliable approach without service role key:
  // Use the Supabase Management API to run SQL directly
  // GET https://api.supabase.com/v1/projects/{ref}/database/query
  
  // Try the pg admin endpoint format
  const pgSqlPayload = {
    query: WEDDING_IDS_TO_FIX.map(id => 
      `UPDATE public.weddings SET qr_activation_time = NOW() - INTERVAL '1 day', qr_expires_at = NOW() + INTERVAL '7 days' WHERE id = '${id}' AND payment_status = 'paid'`
    ).join('; ')
  };
  
  console.log('\n📋 MANUAL FIX REQUIRED:');
  console.log('Open Supabase Dashboard → SQL Editor and run:');
  console.log('='.repeat(60));
  WEDDING_IDS_TO_FIX.forEach(id => {
    const w = (before || []).find(x => x.id === id);
    const nanoid = w?.nanoid || 'unknown';
    console.log(`-- Fix ${nanoid}:`);
    console.log(`UPDATE public.weddings`);
    console.log(`  SET qr_activation_time = now() - interval '1 day',`);
    console.log(`      qr_expires_at = now() + interval '7 days'`);
    console.log(`  WHERE id = '${id}';`);
    console.log('');
  });
  console.log('='.repeat(60));
  
  // Also try to use Supabase's pg REST if available
  // The pg function endpoint:
  const pgEndpoints = [
    `${DEV_URL}/rest/v1/rpc/exec_sql`,
    `${DEV_URL}/pg/query`
  ];
  
  for (const ep of pgEndpoints) {
    try {
      const r = await fetchWithTimeout(ep, { method: 'OPTIONS' });
      console.log(`\n${ep}: ${r.status}`);
    } catch(e) {
      // expected to fail
    }
  }
}

main().catch(console.error);
