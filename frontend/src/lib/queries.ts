import { supabase } from '@/config/supabaseClient';

// ─── Wedding Queries ──────────────────────────────────────────────────────────

/**
 * Fetch all weddings owned by the authenticated user.
 * Called via TanStack Query as: queryFn: () => fetchUserWeddings(user.id)
 * Defense-in-depth: explicit .eq('user_id', userId) + RLS both enforce isolation.
 */
export async function fetchUserWeddings(userId: string): Promise<any[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('weddings')
    .select('*')
    .eq('user_id', userId)           // ← explicit filter — never returns other users' data
    .eq('payment_status', 'paid')    // ← only show paid weddings
    .not('qr_link', 'is', null)      // ← ensure QR is generated
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Fetch a single wedding by its nanoid — for the authenticated user (QR page, dashboard).
 * Replaces: GET /functions/v1/get-wedding-details (authenticated version)
 * RLS: weddings.user_id = auth.uid()
 */
export async function fetchWeddingByNanoId(nanoid: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('weddings')
    .select('*')
    .eq('nanoid', nanoid)
    .eq('payment_status', 'paid')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fetch wedding details for the PUBLIC guest form (no auth required).
 * Uses anon key — requires a public SELECT policy on weddings for nanoid lookups.
 * Replaces: GET /functions/v1/get-wedding-details (public version)
 */
export async function fetchPublicWeddingByNanoId(nanoid: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('weddings')
    .select('*')
    .eq('nanoid', nanoid)
    .eq('payment_status', 'paid')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// ─── Guest Queries ────────────────────────────────────────────────────────────

/**
 * Fetch all guests for a specific wedding (authenticated owner only).
 * Replaces: GET /functions/v1/get-guests?wedding_id=...
 * RLS: guests table requires wedding owner (auth.uid() matches weddings.user_id)
 */
export async function fetchGuests(weddingId: string): Promise<any[]> {
  if (!weddingId) return [];

  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
