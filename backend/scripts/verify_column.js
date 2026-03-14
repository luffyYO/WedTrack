import supabase from '../config/db.js';

async function checkColumn() {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('gift_side')
      .limit(1);

    if (error) {
      if (error.code === '42703') {
        console.log("COLUMN_EXISTS: FALSE");
      } else {
        console.error("SUPABASE_ERROR:", error.message);
      }
    } else {
      console.log("COLUMN_EXISTS: TRUE");
    }
  } catch (err) {
    console.error("CHECK_FAILED:", err.message);
  }
}

checkColumn();
