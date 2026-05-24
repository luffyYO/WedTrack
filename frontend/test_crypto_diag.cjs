const https = require('https');

const DEV_URL = 'vplasmjfvhzcjpfpebvy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGFzbWpmdmh6Y2pwZnBlYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDc0MzIsImV4cCI6MjA4OTkyMzQzMn0.4rbX2DwG0ABFtXYq-_FNRUkpKNR8D9qzlikglJB4Wto';
const DEV_ADMIN_TOKEN = 'wedtrack-dev-admin-2026';

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
  console.log('Invoking diagnose_crypto action on dev-admin...');
  const result = await post('/functions/v1/dev-admin',
    { action: 'diagnose_crypto' },
    { 'x-internal-key': DEV_ADMIN_TOKEN }
  );

  console.log('HTTP Status:', result.status);
  console.log('Response Body:', JSON.stringify(result.body, null, 2));
}

main().catch(console.error);
