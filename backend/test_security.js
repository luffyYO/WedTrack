async function testSecurity() {
  const WEDDING_ID = '3e2defc7-0ad2-4f36-a363-2fbf0082f8a8'; // Any UUID works for testing input validation first, before DB checks it? Actually, wedding_id is a foreign key, so fake UUID might fail at DB insert. 
  // Wait, let's fetch a real wedding ID first.
  
  let realWeddingId = '';
  try {
    const res = await fetch('http://localhost:5000/');
    // this returns 'Database connected...' and we also want a real wedding ID, but we can just use the public /api/weddings/:id/qr if we know one, or let validation fail on invalid name first.
    // Since input validation happens BEFORE the DB insert, a fake UUID is fine for testing validation failures because they return 400 early!
  } catch (e) {}

  const url = 'http://localhost:5000/api/guests/submit';
  
  const testCases = [
    { name: 'Gibberish Name', body: { weddingId: '123', firstName: 'agfkgjafkjg', amount: '100' }, expectStatus: 400 },
    { name: 'Consecutive Same Chars', body: { weddingId: '123', firstName: 'aaaaa', amount: '100' }, expectStatus: 400 },
    { name: 'Numbers in Name', body: { weddingId: '123', firstName: 'Rahul123', amount: '100' }, expectStatus: 400 },
    { name: 'Invalid Amount (0)', body: { weddingId: '123', firstName: 'Rahul', amount: '0' }, expectStatus: 400 },
    { name: 'Invalid Amount (negative)', body: { weddingId: '123', firstName: 'Rahul', amount: '-50' }, expectStatus: 400 },
    { name: 'Valid Request (will fail at DB insert due to fake weddingId, returns 500)', body: { weddingId: '00000000-0000-0000-0000-000000000000', firstName: 'Rahul Test', amount: '100', paymentType: 'Cash' }, expectStatus: 500 }
  ];

  console.log('--- Testing Input Validation ---');
  for (const tc of testCases) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tc.body)
    });
    const data = await res.json();
    console.log(`[${tc.name}]: Expected ${tc.expectStatus}, Got ${res.status} ->`, data.error || data.message || data);
  }

  console.log('\n--- Testing Rate Limiting (11 identical valid-format requests) ---');
  let rateLimitHit = false;
  for (let i = 1; i <= 11; i++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weddingId: '00000000-0000-0000-0000-000000000000', firstName: 'Rate Limit Test', amount: '10' })
    });
    
    if (res.status === 429) {
      console.log(`Request ${i}: Rate Limit Hit! Status 429`);
      rateLimitHit = true;
      break;
    } else {
      console.log(`Request ${i}: Status ${res.status}`);
    }
  }

  if (!rateLimitHit) {
    console.log("WAIT: Rate limit was not hit after 11 requests!");
  } else {
    console.log("Rate Limit successfully verified.");
  }
}

testSecurity();
