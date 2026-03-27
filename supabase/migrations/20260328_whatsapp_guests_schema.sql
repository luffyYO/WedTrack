-- =============================================================================
-- WedTrack: WhatsApp Integration & Guest Schema Update
-- Run this in Supabase Dashboard → SQL Editor:
-- https://supabase.com/dashboard/project/knmqezafmenqghiheloi/sql
-- =============================================================================

-- 1. Add new columns to guests table
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS fullname TEXT,
  ADD COLUMN IF NOT EXISTS father_fullname TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS message_sent_at TIMESTAMPTZ;

-- 2. Backwards compatibility check
-- Map existing first_name + last_name to the new `fullname` column
UPDATE public.guests
SET fullname = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE fullname IS NULL AND first_name IS NOT NULL;

-- 3. Map `is_paid` boolean to the new `payment_status` column
UPDATE public.guests
SET payment_status = CASE WHEN is_paid THEN 'paid' ELSE 'pending' END
WHERE payment_status = 'pending';
