-- =====================================================================
-- WedTrack: Admin Role System Migration
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vplasmjfvhzcjpfpebvy/sql/new
--
-- Safe to re-run (idempotent). Does NOT modify existing data.
-- =====================================================================

-- ─── 1. admin_users TABLE ─────────────────────────────────────────────────────
-- Links a Supabase Auth user to an admin role + status.
-- Only populated via the service role key — not user-writable.
CREATE TABLE IF NOT EXISTS public.admin_users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT        NOT NULL DEFAULT 'admin'
                           CHECK (role IN ('admin', 'super_admin')),
  status       TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'inactive')),
  invited_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_status  ON public.admin_users(status);

-- ─── 2. admin_audit_log TABLE ─────────────────────────────────────────────────
-- Immutable record of all significant admin actions.
-- Never stores passwords, tokens, or sensitive secrets.
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action       TEXT        NOT NULL,
  target_type  TEXT,                              -- 'admin_user', 'platform_user', 'wedding', etc.
  target_id    TEXT,                              -- UUID or email depending on target_type
  metadata     JSONB       DEFAULT '{}'::jsonb,   -- Safe contextual data only
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor     ON public.admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action    ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created   ON public.admin_audit_log(created_at DESC);

-- ─── 3. RLS ───────────────────────────────────────────────────────────────────
-- Both tables are ONLY accessible via edge functions using the service role key.
-- Direct access from authenticated/anon roles is denied.

ALTER TABLE public.admin_users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop any stale policies first
DROP POLICY IF EXISTS "admin_users_no_direct_access"     ON public.admin_users;
DROP POLICY IF EXISTS "admin_audit_log_no_direct_access" ON public.admin_audit_log;

-- Nobody can directly read or write these tables via the client SDK
-- (Service role bypasses RLS — used exclusively in edge functions)
CREATE POLICY "admin_users_no_direct_access"
  ON public.admin_users
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "admin_audit_log_no_direct_access"
  ON public.admin_audit_log
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- ─── 4. updated_at TRIGGER ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 5. HELPER: is_super_admin() ──────────────────────────────────────────────
-- Callable RPC to check if the current authenticated user is a super_admin.
-- Can be used in future RLS policies or server-side checks.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND status = 'active'
  );
$$;

-- ─── 6. BOOTSTRAP NOTE ────────────────────────────────────────────────────────
-- After running this migration, insert your existing admin user as super_admin
-- by running the following snippet (replace the email with your admin's email):
--
-- INSERT INTO public.admin_users (user_id, role, status)
-- SELECT id, 'super_admin', 'active'
-- FROM auth.users
-- WHERE email = 'your-existing-admin@example.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', status = 'active';
--
-- See the walkthrough.md for the exact command with your admin's email.

-- ─── 7. VERIFY ────────────────────────────────────────────────────────────────
SELECT
  table_name,
  COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('admin_users', 'admin_audit_log')
GROUP BY table_name
ORDER BY table_name;
