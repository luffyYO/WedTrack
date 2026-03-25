import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Service role client — bypasses ALL Supabase Row Level Security.
// Only for use in admin-level backend operations. NEVER expose to frontend.
const adminSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
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
