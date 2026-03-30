-- =====================================================================
-- WedTrack DEV: Seed Data for Testing
-- Run AFTER DEV_SETUP_run_in_sql_editor.sql
-- https://supabase.com/dashboard/project/vplasmjfvhzcjpfpebvy/sql/new
-- =====================================================================
-- NOTE: This inserts a test wedding for YOUR user account.
-- Replace <YOUR_USER_ID> with your actual UUID from:
-- Supabase Dashboard → Authentication → Users → copy your user's UUID

DO $$
DECLARE
  v_user_id    UUID := '<YOUR_USER_ID>';  -- ← REPLACE THIS
  v_wedding_id UUID;
BEGIN
  -- Insert test wedding
  INSERT INTO public.weddings (
    user_id, nanoid, bride_name, groom_name,
    wedding_date, village, location,
    qr_activated_at, qr_expires_at
  ) VALUES (
    v_user_id,
    'dev-test-001',
    'Priya',
    'Rahul',
    CURRENT_DATE + INTERVAL '7 days',
    'Hyderabad',
    'Telangana',
    now(),
    now() + INTERVAL '24 hours'
  )
  ON CONFLICT (nanoid) DO NOTHING
  RETURNING id INTO v_wedding_id;

  IF v_wedding_id IS NULL THEN
    SELECT id INTO v_wedding_id FROM public.weddings WHERE nanoid = 'dev-test-001';
  END IF;

  -- Insert 5 test guests (mix of paid/pending, both sides, different methods)
  INSERT INTO public.guests (
    wedding_id, fullname, father_fullname, phone_number, amount,
    payment_type, payment_status, is_paid, gift_side, village, is_read
  ) VALUES
    (v_wedding_id, 'Arjun Sharma',   'Ramesh Sharma',   '9876543210', 1500,  'GPay',    'paid',    true,  'bride', 'Nizamabad', false),
    (v_wedding_id, 'Kavitha Reddy',  'Narayana Reddy',  '9876543211', 2100,  'PhonePe', 'paid',    true,  'groom', 'Warangal',  false),
    (v_wedding_id, 'Suresh Kumar',   'Vijay Kumar',     '9876543212',  500,  'Cash',    'pending', false, 'bride', 'Karimnagar', false),
    (v_wedding_id, 'Anitha Rao',     'Kondaiah Rao',    '9876543213', 3000,  'Paytm',   'paid',    true,  'groom', 'Kurnool',   true),
    (v_wedding_id, 'Ravi Teja',      'Srinivas Teja',   '9876543214',  800,  'GPay',    'pending', false, 'bride', 'Nellore',   false);

  RAISE NOTICE 'Seed complete. Wedding ID: %', v_wedding_id;
END $$;
