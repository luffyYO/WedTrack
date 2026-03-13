import supabase from '../config/db.js';

async function testCreate() {
  const expiry = new Date(Date.now() + 2 * 60 * 1000).toISOString();
  console.log("Calculated Expiry (2 mins):", expiry);

  try {
    const { data, error } = await supabase
      .from('weddings')
      .insert([
        {
          bride_name: "TestBride",
          groom_name: "TestGroom",
          location: "TestVenue",
          wedding_date: "2026-12-25",
          village: "TestVillage",
          user_id: "687b1cc1-f597-4001-a18a-f5cc9831518b", // RN's ID from previous logs
          qr_expires_at: expiry
        }
      ])
      .select('id, qr_expires_at')
      .single();

    if (error) {
      console.error("Insert Error:", error.message);
      return;
    }

    console.log("Database Returned Expiry:", data.qr_expires_at);
    
    // Check if it's 2 mins or 24 hrs from now
    const dbExpiry = new Date(data.qr_expires_at).getTime();
    const diff = dbExpiry - Date.now();
    const diffMins = Math.round(diff / 60000);
    console.log("Diff in minutes:", diffMins);

  } catch (err) {
    console.error("Crash:", err.message);
  }
}

testCreate();
