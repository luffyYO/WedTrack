-- ============================================================
-- DEV ONLY: QR Timing Patch — 2026-05-23
-- Target: https://supabase.com/dashboard/project/vplasmjfvhzcjpfpebvy/sql/new
-- Purpose: All paid DEV weddings have expired QR windows.
--          Patch the most recently created paid wedding to be
--          currently active with a realistic 28-hour window.
-- Architecture: Preserves ~28h window, does NOT widen to days.
-- ============================================================

-- Step 1: Patch the most recently created paid wedding
-- (the active test wedding — 8DwHXmGTIC, id: cc8378e6-61b8-4c20-8262-41381c9e7902)
UPDATE public.weddings
  SET
    payment_status     = 'paid',
    qr_activation_time = now() - INTERVAL '5 minutes',
    qr_expires_at      = now() + INTERVAL '28 hours'
  WHERE id = 'cc8378e6-61b8-4c20-8262-41381c9e7902';

-- Step 2: Patch the second most recent paid wedding as a backup
UPDATE public.weddings
  SET
    payment_status     = 'paid',
    qr_activation_time = now() - INTERVAL '5 minutes',
    qr_expires_at      = now() + INTERVAL '28 hours'
  WHERE id = '18fc3031-9a78-487b-bde2-3be2a5ed4ae2';

-- Step 3: Verify result
SELECT
  id,
  nanoid,
  payment_status,
  selected_plan,
  qr_activation_time,
  qr_expires_at,
  CASE
    WHEN qr_activation_time IS NULL               THEN 'NO_ACTIVATION_SET'
    WHEN qr_activation_time > now()               THEN 'NOT_YET_ACTIVE'
    WHEN qr_expires_at IS NULL                    THEN 'ACTIVE_NO_EXPIRY'
    WHEN qr_expires_at < now()                    THEN 'EXPIRED'
    ELSE                                               'ACTIVE'
  END AS qr_timing_status,
  EXTRACT(EPOCH FROM (qr_expires_at - now()))/3600 AS hours_remaining
FROM public.weddings
WHERE payment_status = 'paid'
ORDER BY created_at DESC
LIMIT 5;
