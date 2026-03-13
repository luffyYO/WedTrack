import supabase from '../config/db.js';

async function checkColumns() {
  try {
    const { data, error } = await supabase
      .from('weddings')
      .select('*')
      .limit(1);

    if (error) {
      console.error("ERROR:", error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log("COLUMNS:", Object.keys(data[0]).join(', '));
    } else {
      console.log("NO_DATA: No records found to check columns.");
      // If no data, we can try to insert a dummy record and catch the error if column missing
    }
  } catch (err) {
    console.error("CRASH:", err.message);
  }
}

checkColumns();
