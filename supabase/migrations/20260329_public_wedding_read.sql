-- =============================================================================
-- WedTrack: Public read policy for weddings (nanoid lookup for guest form)
-- Run this in Supabase Dashboard → SQL Editor:
-- https://supabase.com/dashboard/project/knmqezafmenqghiheloi/sql
-- =============================================================================

-- Allow anonymous (unauthenticated) users to read wedding details.
-- Required for: GuestFormPage (public page, no auth).
-- This is safe because weddings only contain public event information.
DROP POLICY IF EXISTS "weddings_select_public_by_nanoid" ON weddings;

CREATE POLICY "weddings_select_public_by_nanoid"
  ON weddings FOR SELECT
  TO anon
  USING (true);

-- ─── Additional Performance Indexes (idempotent) ─────────────────────────────
-- These supplement the indexes already in 20260327_fix_guests_schema.sql

CREATE INDEX IF NOT EXISTS idx_weddings_user_id
  ON weddings(user_id);

CREATE INDEX IF NOT EXISTS idx_guests_is_paid
  ON guests(wedding_id, is_paid);
