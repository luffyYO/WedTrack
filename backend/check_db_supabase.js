import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
// We must use the SERVICE ROLE KEY to bypass RLS to check if the row exists
// But we don't have it. We will try using the ANON key first to see if our public read policy worked.
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: wedding, error } = await supabase
      .from('weddings')
      .select('*')
      .eq('id', 'c02bed0b-bbad-4e63-860d-f9ef7cad0765');
      
    fs.writeFileSync('db_out_supabase.json', JSON.stringify({ wedding, error }, null, 2));
  } catch (err) {
    fs.writeFileSync('db_out_supabase.json', JSON.stringify({ error: err.message }));
  }
}

run();
