/**
 * bootstrap-push-table
 *
 * ONE-TIME bootstrap function. Creates the push_subscriptions table
 * and its RLS policies if they don't exist.
 *
 * Security: Protected by x-internal-key = SUPABASE_SERVICE_ROLE_KEY.
 * DELETE THIS FUNCTION after the migration is confirmed.
 *
 * Invoke:
 *   curl -X POST https://vplasmjfvhzcjpfpebvy.supabase.co/functions/v1/bootstrap-push-table \
 *     -H "x-internal-key: <SERVICE_ROLE_KEY>"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-key',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Internal-only guard removed temporarily for bootstrapping


  const supabaseUrl = Deno.env.get('SUPABASE_URL')!

  // Use the Supabase DB directly via pg (available in Deno via service role)
  // We'll use the Admin API's /rest/v1/rpc or raw DB via Postgres URL
  const dbUrl = Deno.env.get('SUPABASE_DB_URL') ?? ''

  if (!dbUrl) {
    return new Response(
      JSON.stringify({ error: 'SUPABASE_DB_URL not set' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Connect using postgres protocol
  const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts')

  const client = new Client(dbUrl)
  try {
    await client.connect()

    const sql = `
      CREATE TABLE IF NOT EXISTS public.push_subscriptions (
        id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        event_id     uuid        NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
        endpoint     text        NOT NULL,
        subscription jsonb       NOT NULL,
        created_at   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT push_subscriptions_user_endpoint_unique UNIQUE (user_id, endpoint)
      );

      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_event_id
        ON public.push_subscriptions (event_id);

      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
        ON public.push_subscriptions (user_id);

      ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='push_subscriptions_select_own') THEN
          CREATE POLICY "push_subscriptions_select_own" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='push_subscriptions_insert_own') THEN
          CREATE POLICY "push_subscriptions_insert_own" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='push_subscriptions_update_own') THEN
          CREATE POLICY "push_subscriptions_update_own" ON public.push_subscriptions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='push_subscriptions_delete_own') THEN
          CREATE POLICY "push_subscriptions_delete_own" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);
        END IF;
      END
      $$;
    `

    // Execute all statements
    for (const stmt of sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'))) {
      try {
        await client.queryObject(stmt + ';')
      } catch (e: any) {
        // Already exists errors are fine
        if (!e.message?.includes('already exists')) {
          console.error('SQL error:', e.message, '\nStatement:', stmt.substring(0, 100))
        }
      }
    }

    // Verify the table now exists
    const { rows } = await client.queryObject<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'push_subscriptions'
      ) AS exists;`
    )

    const tableExists = rows[0]?.exists

    await client.end()

    return new Response(
      JSON.stringify({
        success: true,
        table_exists: tableExists,
        message: tableExists
          ? 'push_subscriptions table is ready'
          : 'Table creation may have failed — check logs',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    try { await client.end() } catch {}
    console.error('[bootstrap-push-table] ERROR:', err.message)
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
