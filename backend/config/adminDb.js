import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fail gracefully at runtime if keys are missing instead of crashing at startup
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Admin features will not work.");
}

const adminSupabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Run a raw SQL query via Supabase RPC (optional helper).
 * Prefer using adminSupabase.from(...) directly for typed queries.
 */
export const adminQuery = async (sql, params = []) => {
  // Use Supabase's rpc for raw SQL - only available with service role
  const { data, error } = await adminSupabase.rpc('exec_sql', { query: sql, params });
  if (error) throw new Error(error.message);
  return { rows: data || [] };
};

export default adminSupabase;
