-- =====================================================================
-- WedTrack DEV: Complete Schema Setup
-- Run this ONCE in your DEV Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vplasmjfvhzcjpfpebvy/sql/new
-- =====================================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. WEDDINGS TABLE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weddings (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nanoid           TEXT          UNIQUE,
  bride_name       TEXT          NOT NULL,
  groom_name       TEXT          NOT NULL,
  wedding_date     DATE,
  village          TEXT,
  location         TEXT,
  qr_activated_at  TIMESTAMPTZ,
  qr_expires_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weddings_user_id ON public.weddings(user_id);
CREATE INDEX IF NOT EXISTS idx_weddings_nanoid  ON public.weddings(nanoid);

-- RLS
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "weddings_select_owner"      ON public.weddings;
DROP POLICY IF EXISTS "weddings_insert_owner"      ON public.weddings;
DROP POLICY IF EXISTS "weddings_update_owner"      ON public.weddings;
DROP POLICY IF EXISTS "weddings_delete_owner"      ON public.weddings;
DROP POLICY IF EXISTS "weddings_anon_nanoid_lookup" ON public.weddings;
DROP POLICY IF EXISTS "Users can view their weddings"   ON public.weddings;
DROP POLICY IF EXISTS "Users can insert their weddings" ON public.weddings;
DROP POLICY IF EXISTS "Users can update their weddings" ON public.weddings;
DROP POLICY IF EXISTS "Users can delete their weddings" ON public.weddings;

CREATE POLICY "weddings_select_owner"
  ON public.weddings FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "weddings_insert_owner"
  ON public.weddings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "weddings_update_owner"
  ON public.weddings FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "weddings_delete_owner"
  ON public.weddings FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Allow anon to read by nanoid (used by public guest form page)
CREATE POLICY "weddings_anon_nanoid_lookup"
  ON public.weddings FOR SELECT TO anon
  USING (nanoid IS NOT NULL);

-- ─── 2. GUESTS TABLE ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.guests (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id       UUID          NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  -- Current canonical name columns
  fullname         TEXT,
  father_fullname  TEXT,
  phone_number     TEXT,
  -- Legacy columns kept for compatibility
  first_name       TEXT,
  last_name        TEXT,
  father_first_name TEXT,
  father_last_name  TEXT,
  -- Core fields
  amount           NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_type     TEXT          NOT NULL DEFAULT 'Cash',
  payment_status   TEXT          NOT NULL DEFAULT 'pending',
  is_paid          BOOLEAN       NOT NULL DEFAULT FALSE,
  wishes           TEXT,
  gift_side        TEXT,
  village          TEXT,
  district         TEXT,
  location         TEXT,
  is_read          BOOLEAN       NOT NULL DEFAULT FALSE,
  message_sent_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_guests_wedding_created ON public.guests(wedding_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guests_wishes_partial
  ON public.guests(wedding_id, created_at DESC)
  WHERE wishes IS NOT NULL AND wishes <> '';
CREATE INDEX IF NOT EXISTS idx_guests_unread
  ON public.guests(wedding_id, is_read)
  WHERE is_read = FALSE;

-- RLS
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guests_insert_public"  ON public.guests;
DROP POLICY IF EXISTS "guests_select_owner"   ON public.guests;
DROP POLICY IF EXISTS "guests_update_owner"   ON public.guests;
DROP POLICY IF EXISTS "guests_delete_owner"   ON public.guests;

-- Anyone can insert via guest form (public)
CREATE POLICY "guests_insert_public"
  ON public.guests FOR INSERT
  WITH CHECK (true);

-- Only wedding owner can read their guests
CREATE POLICY "guests_select_owner"
  ON public.guests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.weddings
      WHERE weddings.id = guests.wedding_id
        AND weddings.user_id = auth.uid()
    )
  );

-- Only wedding owner can update guests
CREATE POLICY "guests_update_owner"
  ON public.guests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.weddings
      WHERE weddings.id = guests.wedding_id
        AND weddings.user_id = auth.uid()
    )
  );

-- Only wedding owner can delete guests
CREATE POLICY "guests_delete_owner"
  ON public.guests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.weddings
      WHERE weddings.id = guests.wedding_id
        AND weddings.user_id = auth.uid()
    )
  );

-- ─── 3. ENABLE REALTIME ───────────────────────────────────────────────────────
-- Enable realtime for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weddings;

-- ─── 4. VERIFY ────────────────────────────────────────────────────────────────
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('weddings', 'guests')
ORDER BY table_name, ordinal_position;

-- ─── 5. CASHFREE PAYMENTS MIGRATION ───────────────────────────────────────────
-- Run this block below to apply changes for Cashfree Payment Gateway Integration
ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS cf_order_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS selected_plan VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_weddings_payment_status ON public.weddings(payment_status);
CREATE INDEX IF NOT EXISTS idx_weddings_cf_order_id ON public.weddings(cf_order_id);
CREATE INDEX IF NOT EXISTS idx_weddings_selected_plan ON public.weddings(selected_plan);

-- Explicitly allow the service role (used entirely by backend) to update these fields.
-- Anonymous and user roles shouldn't be able to manually bypass payment!
