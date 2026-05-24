import { createClient } from '@supabase/supabase-js';

// .trim() is critical: hosting providers (Vercel, Netlify) sometimes inject
// a trailing \n into env var values, which becomes %0A in the WebSocket URL
// and causes every Realtime connection to fail immediately.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] URL or Anon Key is missing. Check environment variables.');
} else {
  // Sanity-check: a valid JWT ends with a base64url character, never a newline.
  const lastChar = supabaseKey.charCodeAt(supabaseKey.length - 1);
  if (lastChar === 10 || lastChar === 13) {
    console.error('[Supabase] ANON KEY has a trailing newline! Realtime will fail. Fix hosting env vars.');
  } else {
    console.debug(`[Supabase] Key OK — length=${supabaseKey.length}, suffix=...${supabaseKey.slice(-6)}`);
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
