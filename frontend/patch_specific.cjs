const https = require('https');

const DEV_URL = 'vplasmjfvhzcjpfpebvy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGFzbWpmdmh6Y2pwZnBlYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDc0MzIsImV4cCI6MjA4OTkyMzQzMn0.4rbX2DwG0ABFtXYq-_FNRUkpKNR8D9qzlikglJB4Wto';
const DEV_ADMIN_TOKEN = 'wedtrack-dev-admin-2026';

function call(path, body) {
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
  const weddingId = '28792107-405f-4d50-8176-ca97d65cf17c'; // BZidYXAIAg
  console.log(`Patching DEV wedding ID ${weddingId} (BZidYXAIAg) to make it active...`);
  const result = await call('/functions/v1/dev-admin', {
    action: 'patch_dev_weddings',
    target_ids: [weddingId],
  });
  console.log(`Status: ${result.status}`);
  console.log('Result:', JSON.stringify(result.body, null, 2));
}

main().catch(console.error);
