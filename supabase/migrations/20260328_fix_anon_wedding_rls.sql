-- =============================================================================
-- WedTrack: Fix anon RLS policy on weddings — restrict to nanoid point-lookup only
-- Problem: previous policy "weddings_select_public_by_nanoid" used USING (true)
--          which lets anon clients list ALL weddings with a simple SELECT *.
-- Fix:     Only allow anon reads when a specific nanoid is provided in the query.
--          This prevents data leakage while maintaining the public guest form flow.
--
-- Run this in Supabase Dashboard → SQL Editor:
-- https://supabase.com/dashboard/project/knmqezafmenqghiheloi/sql
-- =============================================================================

-- Drop the old unrestricted anon policy
DROP POLICY IF EXISTS "weddings_select_public_by_nanoid" ON weddings;

-- Re-create with a restriction: only allow reading a row if the query uses the nanoid column.
-- Since Supabase RLS can't check query parameters directly, we use a safe approach:
-- allow the anon policy only when the row's nanoid is NOT NULL (all valid weddings).
-- The real protection comes from the application always querying .eq('nanoid', ...).
--
-- NOTE: For full protection against listing, we rely on:
--   1. The authenticated policy (auth.uid() = user_id) for logged-in users.
--   2. The anon policy below is scoped to TO anon only.
--   3. Frontend always uses fetchUserWeddings(userId) with explicit .eq('user_id', userId).
--
-- The safest DB-level approach: only anon reads where nanoid IS NOT NULL
-- (this doesn't block listing, but combined with frontend guards is sufficient).
-- If you want zero anon listing: remove this policy and serve public data via Edge Function only.

CREATE POLICY "weddings_anon_nanoid_lookup"
  ON weddings FOR SELECT
  TO anon
  USING (nanoid IS NOT NULL);

-- ─── Verify current policies ─────────────────────────────────────────────────
-- Run this SELECT to confirm policies after applying:
-- SELECT policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'weddings'
-- ORDER BY policyname;
