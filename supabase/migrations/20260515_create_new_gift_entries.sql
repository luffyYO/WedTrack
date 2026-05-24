-- =============================================================================
-- WedTrack: NewGift Manual Entries Schema
-- Run this in Supabase SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS new_gift_entries (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name    TEXT         NOT NULL,
  father_name    TEXT,
  amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_type    TEXT         NOT NULL DEFAULT 'Cash', -- Cash, Gold, Silver, Gift
  village        TEXT,
  gift_date      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_new_gifts_user_created ON new_gift_entries(user_id, created_at DESC);

-- Row Level Security
ALTER TABLE new_gift_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own gift entries" ON new_gift_entries;
DROP POLICY IF EXISTS "Users can view their own gift entries" ON new_gift_entries;
DROP POLICY IF EXISTS "Users can update their own gift entries" ON new_gift_entries;
DROP POLICY IF EXISTS "Users can delete their own gift entries" ON new_gift_entries;

CREATE POLICY "Users can insert their own gift entries"
  ON new_gift_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own gift entries"
  ON new_gift_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own gift entries"
  ON new_gift_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gift entries"
  ON new_gift_entries FOR DELETE
  USING (auth.uid() = user_id);
