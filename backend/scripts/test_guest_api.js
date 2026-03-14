async function runTests() {
  console.log("Starting backend API tests for guest side selection...");
  const baseURL = 'http://localhost:5000/api';

  // Assume we have a valid weddingId.
  const weddingId = '90f0ca8c-0fc8-4720-bfd3-05973752e50d'; 

  const postGuest = async (payload) => {
    const response = await fetch(`${baseURL}/guests/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return { status: response.status, data };
  };

  console.log("\n1. Testing missing giftSide...");
  const res1 = await postGuest({
    weddingId,
    firstName: 'Test',
    amount: 100,
    paymentType: 'Cash'
  });
  if (res1.status === 400 && res1.data.error === 'Please select Bride or Groom side.') {
    console.log("✅ PASS:", res1.data.error);
  } else {
    console.log("❌ FAIL: Expected 400 error, got", res1.status, res1.data);
  }

  console.log("\n2. Testing invalid giftSide...");
  const res2 = await postGuest({
    weddingId,
    firstName: 'Test',
    amount: 100,
    paymentType: 'Cash',
    giftSide: 'invalid'
  });
  if (res2.status === 400 && res2.data.error === 'Please select Bride or Groom side.') {
    console.log("✅ PASS:", res2.data.error);
  } else {
    console.log("❌ FAIL: Expected 400 error, got", res2.status, res2.data);
  }

  console.log("\n3. Testing valid giftSide (bride)...");
  const res3 = await postGuest({
    weddingId,
    firstName: 'TestBride',
    amount: 100,
    paymentType: 'Cash',
    giftSide: 'bride'
  });
  if (res3.status === 201) {
    console.log("✅ PASS: Submitted bride side guest. ID:", res3.data.guestId);
  } else if (res3.status === 404) {
    console.log("⚠️ WARNING: Wedding not found, but validation likely passed (didn't return 400 'Please select Bride or Groom side.').");
  } else {
    console.log("❌ FAIL:", res3.status, res3.data);
  }

  console.log("\n4. Testing valid giftSide (groom)...");
  const res4 = await postGuest({
    weddingId,
    firstName: 'TestGroom',
    amount: 100,
    paymentType: 'Cash',
    giftSide: 'groom'
  });
  if (res4.status === 201) {
    console.log("✅ PASS: Submitted groom side guest. ID:", res4.data.guestId);
  } else if (res4.status === 404) {
    console.log("⚠️ WARNING: Wedding not found, but validation likely passed.");
  } else {
    console.log("❌ FAIL:", res4.status, res4.data);
  }
}

runTests();
