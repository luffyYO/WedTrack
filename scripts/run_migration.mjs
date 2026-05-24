/**
 * Temporary migration runner — runs the push_subscriptions DDL
 * via the Supabase Management API using the CLI's stored access token.
 * 
 * Run: node scripts/run_migration.mjs <SUPABASE_ACCESS_TOKEN>
 */
import https from 'https';

const PROJECT_REF = 'vplasmjfvhzcjpfpebvy';
const token = process.argv[2];

if (!token) {
  console.error('Usage: node scripts/run_migration.mjs <SUPABASE_ACCESS_TOKEN>');
  console.error('Get your token from: https://app.supabase.com/account/tokens');
  process.exit(1);
}

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

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'push_subscriptions'
      AND policyname = 'push_subscriptions_select_own'
  ) THEN
    CREATE POLICY "push_subscriptions_select_own"
      ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'push_subscriptions'
      AND policyname = 'push_subscriptions_insert_own'
  ) THEN
    CREATE POLICY "push_subscriptions_insert_own"
      ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'push_subscriptions'
      AND policyname = 'push_subscriptions_update_own'
  ) THEN
    CREATE POLICY "push_subscriptions_update_own"
      ON public.push_subscriptions FOR UPDATE
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'push_subscriptions'
      AND policyname = 'push_subscriptions_delete_own'
  ) THEN
    CREATE POLICY "push_subscriptions_delete_own"
      ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$do$;

SELECT 'push_subscriptions table ready' AS status;
`;

const body = JSON.stringify({ query: sql });

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      if (res.statusCode === 200) {
        console.log('\n✅ Migration applied successfully!');
      } else {
        console.error('\n❌ Migration failed — see error above');
        process.exit(1);
      }
    } catch {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
  process.exit(1);
});

req.write(body);
req.end();
