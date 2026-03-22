import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: weddings, error } = await supabase
      .from('weddings')
      .select('id, bride_name, groom_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
      
    fs.writeFileSync('db_out_all_supabase.json', JSON.stringify({ weddings, error }, null, 2));
  } catch (err) {
    fs.writeFileSync('db_out_all_supabase.json', JSON.stringify({ error: err.message }));
  }
}

run();
