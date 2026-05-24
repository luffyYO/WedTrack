-- ============================================================
-- Migration: 20260512_push_subscriptions.sql
-- Purpose  : Create push_subscriptions table for Web Push (VAPID).
--            Stores browser PushSubscription objects per user + event.
--
-- Architecture note:
--   This table is ONLY for browser push notifications (new guest entries).
--   It has NO relationship to the in-app bell / wish notification system.
-- ============================================================

-- ── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id     uuid        NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  endpoint     text        NOT NULL,
  subscription jsonb       NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),

  -- One subscription object per user per endpoint (browser/device)
  -- event_id is allowed to change if the user switches active wedding
  CONSTRAINT push_subscriptions_user_endpoint_unique UNIQUE (user_id, endpoint)
);

COMMENT ON TABLE public.push_subscriptions IS
  'Stores Web Push (VAPID) PushSubscription objects for browser push notifications on new guest entries.';

COMMENT ON COLUMN public.push_subscriptions.endpoint IS
  'The push service endpoint URL — unique per browser/device per user.';

COMMENT ON COLUMN public.push_subscriptions.subscription IS
  'Full PushSubscription JSON including endpoint, expirationTime, and keys (p256dh, auth).';

-- ── Indexes ──────────────────────────────────────────────────────────────────

-- Fast lookup when sending notifications for a specific event
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_event_id
  ON public.push_subscriptions (event_id);

-- Fast lookup for cleanup / deduplication by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions (user_id);

-- ── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read only their own subscriptions
CREATE POLICY "push_subscriptions_select_own"
  ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "push_subscriptions_insert_own"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions (e.g. change event_id)
CREATE POLICY "push_subscriptions_update_own"
  ON public.push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions (unsubscribe flow)
CREATE POLICY "push_subscriptions_delete_own"
  ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypasses RLS (used by send-push-notification function)
-- No explicit policy needed — service role skips RLS by default.
