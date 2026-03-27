-- =============================================================================
-- WedTrack: Complete Guests Schema + Performance Indexes
-- Run this once in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/knmqezafmenqghiheloi/sql
-- =============================================================================

-- ─── 1. Create guests table if it doesn't exist ──────────────────────────────
CREATE TABLE IF NOT EXISTS guests (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id     UUID         NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  first_name     TEXT         NOT NULL,
  last_name      TEXT,
  father_first_name TEXT,
  father_last_name  TEXT,
  amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_type   TEXT         NOT NULL DEFAULT 'Cash',
  wishes         TEXT,
  gift_side      TEXT,
  village        TEXT,
  district       TEXT,
  location       TEXT,
  is_read        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── 2. Add missing columns to existing guests table (idempotent) ─────────────
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  -- is_read
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guests' AND column_name = 'is_read'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE guests ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE;
    RAISE NOTICE 'Added column: is_read';
  END IF;

  -- father_first_name
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guests' AND column_name = 'father_first_name'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE guests ADD COLUMN father_first_name TEXT;
    RAISE NOTICE 'Added column: father_first_name';
  END IF;

  -- father_last_name
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guests' AND column_name = 'father_last_name'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE guests ADD COLUMN father_last_name TEXT;
    RAISE NOTICE 'Added column: father_last_name';
  END IF;

  -- location
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guests' AND column_name = 'location'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE guests ADD COLUMN location TEXT;
    RAISE NOTICE 'Added column: location';
  END IF;

  -- village
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guests' AND column_name = 'village'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE guests ADD COLUMN village TEXT;
    RAISE NOTICE 'Added column: village';
  END IF;

  -- district
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guests' AND column_name = 'district'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE guests ADD COLUMN district TEXT;
    RAISE NOTICE 'Added column: district';
  END IF;
END $$;

-- ─── 3. Performance Indexes ───────────────────────────────────────────────────

-- Critical: nanoid lookup in weddings (used by ALL edge functions)
CREATE INDEX IF NOT EXISTS idx_weddings_nanoid
  ON weddings(nanoid);

-- Critical: guest fetch by wedding_id ordered by created_at (paginated wishes)
CREATE INDEX IF NOT EXISTS idx_guests_wedding_created
  ON guests(wedding_id, created_at DESC);

-- Useful: filter guests with wishes (fetch-wishes excludes null wishes)
CREATE INDEX IF NOT EXISTS idx_guests_wishes_partial
  ON guests(wedding_id, created_at DESC)
  WHERE wishes IS NOT NULL AND wishes <> '';

-- Useful: unread count queries
CREATE INDEX IF NOT EXISTS idx_guests_unread
  ON guests(wedding_id, is_read)
  WHERE is_read = FALSE;

-- ─── 4. Row Level Security ───────────────────────────────────────────────────
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to re-create cleanly
DROP POLICY IF EXISTS "guests_insert_public"  ON guests;
DROP POLICY IF EXISTS "guests_select_owner"   ON guests;
DROP POLICY IF EXISTS "guests_update_owner"   ON guests;
DROP POLICY IF EXISTS "guests_delete_owner"   ON guests;

-- Anyone (no auth) can insert — public guest form
CREATE POLICY "guests_insert_public"
  ON guests FOR INSERT
  WITH CHECK (true);

-- Only the wedding owner can read their guests
CREATE POLICY "guests_select_owner"
  ON guests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
        AND weddings.user_id = auth.uid()
    )
  );

-- Only the wedding owner can update guests (mark as read, etc.)
CREATE POLICY "guests_update_owner"
  ON guests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
        AND weddings.user_id = auth.uid()
    )
  );

-- Only the wedding owner can delete guests
CREATE POLICY "guests_delete_owner"
  ON guests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
        AND weddings.user_id = auth.uid()
    )
  );

-- ─── 5. Verify ───────────────────────────────────────────────────────────────
-- After running, verify with:
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'guests'
ORDER BY ordinal_position;
