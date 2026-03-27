import supabase from '../config/db.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', details: 'Missing or malformed token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized', details: error?.message || 'Invalid token' });
    }

    // Create a request-specific Supabase client that forwards the user token
    // This allows Row-Level Security (RLS) policies to see the current authenticated user
    // Use SERVICE_ROLE_KEY if available (dev), fallback to ANON_KEY (prod-style)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const reqSupabase = createClient(process.env.SUPABASE_URL, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    req.user = user;
    req.supabase = reqSupabase;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication failed', details: err.message });
  }
};
