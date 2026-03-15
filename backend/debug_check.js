import supabase from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    const { data, error } = await supabase.from('weddings').select('*').limit(1);
    if (error) {
      console.log('SUPABASE_ERROR_JSON:' + JSON.stringify(error));
    } else {
      console.log('COLUMNS:' + (data.length > 0 ? Object.keys(data[0]).join(',') : 'EMPTY'));
    }
  } catch (e) {
    console.log('EXCEPTION:' + e.message);
  }
}

check();
