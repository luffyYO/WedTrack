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

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT wedding_date FROM weddings LIMIT 10');
    console.log("Migration Verification (First 10 records):");
    res.rows.forEach((row, i) => {
      console.log(`${i+1}: ${row.wedding_date}`);
    });
  } catch (err) {
    console.error("Check failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

check();
