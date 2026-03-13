import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Starting migration with timeout...");
    await client.query("SET statement_timeout = 10000;"); // 10s timeout for the ALTER

    console.log("Adding qr_expires_at column if not exists...");
    await client.query(`
      ALTER TABLE weddings 
      ADD COLUMN IF NOT EXISTS qr_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours');
    `);
    console.log("Column check/add done.");

    await client.query(`
      UPDATE weddings 
      SET qr_expires_at = created_at + interval '24 hours' 
      WHERE qr_expires_at IS NULL;
    `);
    console.log("Existing records updated.");

  } catch (err) {
    console.error("MIGRATION_ERROR:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
