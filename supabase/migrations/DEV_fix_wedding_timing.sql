-- ============================================================
-- DEV ONLY: Fix wedding timing for push notification testing
-- Run this in: https://supabase.com/dashboard/project/vplasmjfvhzcjpfpebvy/sql/new
-- ============================================================

-- Fix all paid weddings to be currently active for DEV testing
-- Sets activation to 1 day ago, expires 7 days from now
UPDATE public.weddings
  SET qr_activation_time = now() - interval '1 day',
      qr_expires_at = now() + interval '7 days'
  WHERE payment_status = 'paid'
    AND id IN (
      '53736a98-b117-46ed-a4a1-8bf87bdcc9da',  -- tCfEFhdZRo (future activation)
      'c4fc36cc-7964-40ab-a18e-c033af5fe19d',  -- ZTI0AizwOU (expired)
      'e242b22d-aed4-4f1d-8556-eabc2dd1039d',  -- fc_OPYpTHh (expired)
      '8c5e907e-c3d3-443b-ab7e-34570e689e77',  -- P5-oTNTmgk (expired)
      '4a49934d-a941-4e0f-b206-ed1313c62131',  -- 3Pms7Pg8uV (expired)
      'e3c9fdd1-24f9-4c91-8abe-08c9d62d08d9'   -- 041RUJrPQY (expired)
    );

-- Verify: show current state
SELECT 
  id,
  nanoid,
  payment_status,
  selected_plan,
  qr_activation_time,
  qr_expires_at,
  CASE
    WHEN qr_activation_time > now() THEN 'NOT YET ACTIVE'
    WHEN qr_expires_at < now() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END AS timing_status
FROM public.weddings
WHERE payment_status = 'paid'
ORDER BY created_at DESC
LIMIT 10;

-- Also verify push_subscriptions table exists
SELECT 
  COUNT(*) as total_subscriptions,
  COUNT(DISTINCT event_id) as unique_events,
  COUNT(DISTINCT user_id) as unique_users
FROM public.push_subscriptions;
