import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Fail gracefully at runtime if keys are missing instead of crashing at startup
if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/ANON_KEY is missing. Database features will not work.");
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

export default supabase;