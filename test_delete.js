const fetch = require('node-fetch');

async function run() {
  const url = 'https://knmqezafmenqghiheloi.supabase.co/functions/v1/delete-guest';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubXFlemFmbWVucWdoaWhlbG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwOTQzNDMsImV4cCI6MjA4ODY3MDM0M30.PzdpR2S_stphlDEBRJpgaMs5I5B_L-X_DJNChlTlRks';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey
      },
      body: JSON.stringify({ guest_id: 'fake-id' })
    });
    const text = await res.text();
    console.log(res.status, text);
  } catch (e) {
    console.error(e);
  }
}
run();
