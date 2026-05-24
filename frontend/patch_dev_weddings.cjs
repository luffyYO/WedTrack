/**
 * DEV ONLY — Patch active test weddings QR timing
 * Run: node patch_dev_weddings.cjs
 */
const https = require('https');

const DEV_URL = 'vplasmjfvhzcjpfpebvy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGFzbWpmdmh6Y2pwZnBlYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDc0MzIsImV4cCI6MjA4OTkyMzQzMn0.4rbX2DwG0ABFtXYq-_FNRUkpKNR8D9qzlikglJB4Wto';

// Target wedding IDs to patch (most recent paid weddings)
const TARGET_IDS = [
  'cc8378e6-61b8-4c20-8262-41381c9e7902',  // nanoid: 8DwHXmGTIC (most recent)
  '18fc3031-9a78-487b-bde2-3be2a5ed4ae2',  // nanoid: 4WIlgYG58Z
  'd5311773-42dc-43a5-b687-5349bcb86dc0',  // nanoid: fdCN2q-3tu
];

async function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: DEV_URL,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
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
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  const now = new Date();
  console.log('='.repeat(60));
  console.log('DEV QR Timing Patch — ' + now.toISOString());
  console.log('='.repeat(60));

  // Step 1: Check current state
  console.log('\n[1] Current wedding state:');
  const { body: current } = await request('GET',
    '/rest/v1/weddings?select=id,nanoid,payment_status,qr_activation_time,qr_expires_at&order=created_at.desc&limit=10',
    null
  );

  if (!Array.isArray(current)) {
    console.error('  ERROR: Could not fetch weddings:', current);
    return;
  }

  for (const w of current) {
    const exp = w.qr_expires_at ? new Date(w.qr_expires_at) : null;
    const act = w.qr_activation_time ? new Date(w.qr_activation_time + (w.qr_activation_time.includes('+') ? '' : 'Z')) : null;
    let status = 'UNKNOWN';
    if (!act) status = 'NO_ACTIVATION';
    else if (now < act) status = 'FUTURE';
    else if (exp && now > exp) status = `EXPIRED (${Math.round((now-exp)/60000)}min ago)`;
    else status = 'ACTIVE';
    console.log(`  ${status.padEnd(30)} | ${w.nanoid || 'NO_NANOID'} | ${w.payment_status}`);
  }

  // Step 2: Patch via PATCH REST API for each target
  // Note: anon can't UPDATE — need to use Edge Function or service role
  // Let's use submit-wish test to verify, but first try direct REST PATCH
  console.log('\n[2] Patching via Supabase REST PATCH (requires correct RLS):');
  
  // The anon key can't UPDATE weddings. We need to use the Edge Function approach.
  // Let's call the extend-wedding function or use direct invocation.
  // Actually: the function needs JWT. Let's test submit-wish with current state first.

  console.log('\n[3] Testing submit-wish with best available wedding:');
  const paid = current.filter(w => w.payment_status === 'paid' && w.nanoid);
  
  for (const w of paid) {
    const exp = w.qr_expires_at ? new Date(w.qr_expires_at) : null;
    const act = w.qr_activation_time ? new Date(w.qr_activation_time + (w.qr_activation_time.includes('+') ? '' : 'Z')) : null;
    const isActive = (!act || now >= act) && (!exp || now <= exp);
    
    if (isActive) {
      console.log(`  Testing active: ${w.nanoid}`);
      const { status, body } = await request('POST', '/functions/v1/submit-wish', {
        wedding_nanoid: w.nanoid,
        fullname: 'DIAG_TEST_' + Date.now(),
        father_fullname: 'Diagnostic Father',
        amount: 0,
        payment_type: 'Cash',
        gift_side: 'bride',
        village: 'DiagVillage',
        wish: 'Automated diagnostic test'
      });
      console.log(`  submit-wish → ${status} | ${JSON.stringify(body).substring(0,200)}`);
      return;
    }
  }

  console.log('  No active wedding found. All paid weddings are expired or inactive.');
  console.log('\n  SQL TO RUN IN SUPABASE DASHBOARD:');
  console.log('  ──────────────────────────────────────────────────────────');
  console.log("  UPDATE public.weddings");
  console.log("    SET payment_status = 'paid',");
  console.log("        qr_activation_time = now() - INTERVAL '5 minutes',");
  console.log("        qr_expires_at = now() + INTERVAL '28 hours'");
  console.log("    WHERE id = 'cc8378e6-61b8-4c20-8262-41381c9e7902';");
  console.log('  ──────────────────────────────────────────────────────────');
  console.log('  URL: https://supabase.com/dashboard/project/vplasmjfvhzcjpfpebvy/sql/new');
}

main().catch(console.error);
