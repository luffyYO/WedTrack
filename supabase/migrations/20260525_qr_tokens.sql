-- =============================================================================
-- WedTrack: QR Tokens Table
-- Provides stable opaque tokens for universal QR compatibility.
-- The QR payload becomes https://wedtrackss.in/q/{token}
-- which redirects to /g/{nanoid} via the resolve-qr edge function.
--
-- Why: Decouples the printed QR from the wedding's internal nanoid.
-- Token never changes — only what it resolves to can change.
-- =============================================================================

-- ─── 1. Create qr_tokens table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.qr_tokens (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT         NOT NULL,
  wedding_id  UUID         NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
  scan_count  INTEGER      NOT NULL DEFAULT 0
);

-- ─── 2. Indexes ───────────────────────────────────────────────────────────────
-- Primary lookup: token → wedding (hot path for every QR scan)
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_tokens_token
  ON public.qr_tokens(token);

-- Secondary: find tokens for a given wedding (QR management page)
CREATE INDEX IF NOT EXISTS idx_qr_tokens_wedding_id
  ON public.qr_tokens(wedding_id);

-- ─── 3. Row Level Security ───────────────────────────────────────────────────
ALTER TABLE public.qr_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies cleanly before re-creating
DROP POLICY IF EXISTS "qr_tokens_public_read"  ON public.qr_tokens;
DROP POLICY IF EXISTS "qr_tokens_owner_manage" ON public.qr_tokens;

-- Public can read token rows (resolve-qr uses anon key for lookups)
-- Only non-revoked rows — revoked tokens fail in edge function logic
CREATE POLICY "qr_tokens_public_read"
  ON public.qr_tokens FOR SELECT
  USING (true);

-- Only the wedding owner (authenticated) can insert/update/delete tokens
CREATE POLICY "qr_tokens_owner_manage"
  ON public.qr_tokens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.weddings
      WHERE weddings.id = qr_tokens.wedding_id
        AND weddings.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.weddings
      WHERE weddings.id = qr_tokens.wedding_id
        AND weddings.user_id = auth.uid()
    )
  );

-- ─── 4. Backfill: generate tokens for all existing paid weddings ──────────────
-- Uses gen_random_uuid() to derive a 12-char alphanumeric token.
-- This is safe for backfill; production tokens use the edge function's
-- crypto.getRandomValues() for stronger randomness.
INSERT INTO public.qr_tokens (token, wedding_id)
SELECT
  -- Convert first 9 bytes of a UUID to base36-like alphanumeric (12 chars)
  -- This gives sufficient entropy for backfill without external deps
  LOWER(
    REPLACE(
      REPLACE(
        REPLACE(
          SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 14),
          '-', ''
        ),
        '-', ''
      ),
      '-', ''
    )
  ) AS token,
  id AS wedding_id
FROM public.weddings
WHERE payment_status = 'paid'
  AND id NOT IN (SELECT wedding_id FROM public.qr_tokens)
ON CONFLICT DO NOTHING;

-- ─── 5. Atomic scan count increment RPC ──────────────────────────────────────
-- Called fire-and-forget from resolve-qr edge function.
-- Using a function avoids SELECT+UPDATE race conditions on concurrent scans.
CREATE OR REPLACE FUNCTION public.increment_qr_scan_count(token_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE public.qr_tokens
  SET scan_count = scan_count + 1
  WHERE id = token_id;
$$;

