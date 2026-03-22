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
    const { data: wedding, error } = await supabase
      .from('weddings')
      .select('*')
      .eq('id', '350ea772-d8e7-41c8-a82d-0f44f1acad74');
      
    fs.writeFileSync('db_out_supabase_new.json', JSON.stringify({ wedding, error }, null, 2));
  } catch (err) {
    fs.writeFileSync('db_out_supabase_new.json', JSON.stringify({ error: err.message }));
  }
}

run();
