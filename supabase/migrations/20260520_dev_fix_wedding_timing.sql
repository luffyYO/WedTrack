-- ============================================================
-- DEV ONLY: Fix wedding timing for push notification testing
-- Timestamp: 20260520 ensures it runs after existing migrations
-- ============================================================

-- Patch all paid DEV weddings so QR form is currently active
-- This allows submit-wish + push notification end-to-end testing
UPDATE public.weddings
  SET qr_activation_time = now() - interval '1 day',
      qr_expires_at = now() + interval '7 days'
  WHERE payment_status = 'paid'
    AND (
      -- Future activation (not yet active)
      qr_activation_time > now()
      OR
      -- Already expired
      qr_expires_at < now()
    );

-- Verify result
DO $$
DECLARE
  active_count integer;
  fixed_count integer;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM public.weddings
  WHERE payment_status = 'paid'
    AND (qr_activation_time IS NULL OR qr_activation_time <= now())
    AND (qr_expires_at IS NULL OR qr_expires_at >= now());
  
  RAISE NOTICE 'DEV timing fix applied. Active weddings: %', active_count;
END $$;
