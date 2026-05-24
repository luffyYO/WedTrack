/**
 * check-table.mjs — verify push_subscriptions table existence via Supabase REST API
 * Run: node scripts/check-table.mjs
 */
import https from 'https';

const SUPABASE_URL = 'vplasmjfvhzcjpfpebvy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGFzbWpmdmh6Y2pwZnBlYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDc0MzIsImV4cCI6MjA4OTkyMzQzMn0.4rbX2DwG0ABFtXYq-_FNRUkpKNR8D9qzlikglJB4Wto';

// Check if table exists by querying it
const options = {
  hostname: SUPABASE_URL,
  port: 443,
  path: '/rest/v1/push_subscriptions?select=id&limit=1',
  method: 'GET',
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`HTTP Status: ${res.statusCode}`);
    if (res.statusCode === 200 || res.statusCode === 406) {
      console.log('✅ Table push_subscriptions EXISTS');
    } else if (res.statusCode === 404) {
      console.log('❌ Table push_subscriptions does NOT exist yet');
    } else {
      console.log(`Response: ${data.substring(0, 300)}`);
    }
  });
});
req.on('error', (e) => console.error('Error:', e.message));
req.end();
