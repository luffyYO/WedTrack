import supabase from './config/db.js';

async function check() {
  const { data, error } = await supabase.from('weddings').select('*').eq('id', '7211687a-7fcf-445e-8bdb-ef1a0911974f').single();
  console.log("DB RESULT:", data, error);
}

check();
