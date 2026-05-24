const { createClient } = require('./node_modules/@supabase/supabase-js');

const DEV_URL = 'https://vplasmjfvhzcjpfpebvy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGFzbWpmdmh6Y2pwZnBlYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDc0MzIsImV4cCI6MjA4OTkyMzQzMn0.4rbX2DwG0ABFtXYq-_FNRUkpKNR8D9qzlikglJB4Wto';

const client = createClient(DEV_URL, ANON_KEY);

async function main() {
  const { data, error } = await client
    .from('weddings')
    .select('id, nanoid, bride_name, groom_name, payment_status, qr_activation_time, qr_expires_at, created_at')
    .eq('nanoid', 'BZidYXAIAg');
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
