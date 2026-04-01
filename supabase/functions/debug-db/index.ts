import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'

export const config = {
  auth: false,
};

Deno.serve(async (req) => {
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await adminClient
    .from('guests')
    .select('id, fullname, fcm_token, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return new Response(JSON.stringify({ data, error }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
