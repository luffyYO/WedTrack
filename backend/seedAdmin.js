/**
 * Run this script ONCE to create the initial admin user.
 * Usage: node seedAdmin.js
 * Default credentials: username=admin, password=128
 */
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function seedAdmin() {
  const username = 'kishore';
  const password = '12345678';

  const passwordHash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from('admin_users')
    .upsert([{ username, password_hash: passwordHash }], { onConflict: 'username' })
    .select('id, username');

  if (error) {
    console.error('❌ Failed to seed admin:', error.message);
    process.exit(1);
  }

  console.log('✅ Admin user seeded successfully:', data);
  console.log('   Username:', username);
  console.log('   Password:', password);
  console.log('\n⚠️  IMPORTANT: Change this password via /admin/settings after first login!');
}

seedAdmin();
