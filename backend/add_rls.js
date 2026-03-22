import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    console.log("Adding RLS policy for public read access to weddings table...");
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'weddings' AND policyname = 'Allow public read access'
        ) THEN
            CREATE POLICY "Allow public read access" ON public.weddings
            FOR SELECT USING (true);
        END IF;
      END
      $$;
    `);
    console.log("Policy added successfully or already exists!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

run();
