-- =============================================================================
-- WedTrack: Fix Supabase Realtime for guests table
-- Run this in DEV SQL Editor:
-- https://supabase.com/dashboard/project/vplasmjfvhzcjpfpebvy/sql/new
-- =============================================================================

-- ── 1. Enable Realtime Publication ───────────────────────────────────────────
-- If the table was never added to supabase_realtime, realtime events 
-- are silently ignored and the channel closes.
DO $$
BEGIN
  -- Remove and re-add to ensure it's registered
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
  EXCEPTION WHEN duplicate_object THEN
    -- Already in publication — no-op
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.weddings;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- ── 2. Set REPLICA IDENTITY FULL on guests ────────────────────────────────────
-- CRITICAL: Without this, Supabase Realtime can ONLY filter by primary key (id).
-- When you subscribe with `filter: 'wedding_id=eq.xxx'`, Postgres's logical
-- replication only sends the PK column for UPDATE/DELETE events by default.
-- Supabase realtime then can't evaluate the filter → CLOSED.
-- REPLICA IDENTITY FULL sends ALL columns in replication events.
ALTER TABLE public.guests REPLICA IDENTITY FULL;
ALTER TABLE public.weddings REPLICA IDENTITY FULL;

-- ── 3. Verify ─────────────────────────────────────────────────────────────────
-- Confirm realtime is enabled: should show guests and weddings in results
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Confirm REPLICA IDENTITY: should show "f" (full) for guests
SELECT relname, relreplident
FROM pg_class
WHERE relname IN ('guests', 'weddings');
-- 'd' = default (primary key only) ← BAD for filters
-- 'f' = full (all columns)         ← REQUIRED for wedding_id filter
