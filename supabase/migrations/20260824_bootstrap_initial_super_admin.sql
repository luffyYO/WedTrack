-- =====================================================================
-- WedTrack: Bootstrap Initial Super Admin
-- Target: ravitejaoffline@gmail.com (WedTracks Admin)
--
-- Idempotent: can be safely executed repeatedly.
-- =====================================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Look up user by email in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower('ravitejaoffline@gmail.com');

  IF v_user_id IS NOT NULL THEN
    -- 2. Update auth.users app_metadata to assign role: admin
    UPDATE auth.users
    SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
    WHERE id = v_user_id;

    -- 3. Upsert into public.admin_users as super_admin + active
    INSERT INTO public.admin_users (user_id, role, status)
    VALUES (v_user_id, 'super_admin', 'active')
    ON CONFLICT (user_id) DO UPDATE
    SET role = 'super_admin', status = 'active', updated_at = now();

    -- 4. Record in admin_audit_log
    INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, metadata)
    VALUES (
      v_user_id,
      'super_admin_bootstrapped',
      'admin_user',
      v_user_id::text,
      jsonb_build_object('email', 'ravitejaoffline@gmail.com', 'role', 'super_admin', 'name', 'WedTracks Admin')
    );

    RAISE NOTICE 'User ravitejaoffline@gmail.com successfully bootstrapped as super_admin (ID: %)', v_user_id;
  ELSE
    RAISE NOTICE 'User ravitejaoffline@gmail.com not found in auth.users yet. Sign up at https://wedtrackss.in/login or run the SQL in Supabase SQL Editor after sign up.';
  END IF;
END $$;
