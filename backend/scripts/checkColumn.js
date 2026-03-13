import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkColumn() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'weddings' AND column_name = 'qr_expires_at'
    `);

    if (res.rows.length > 0) {
      console.log("COLUMN_EXISTS: TRUE");
    } else {
      console.log("COLUMN_EXISTS: FALSE");
    }

  } catch (err) {
    console.error("Check failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkColumn();
