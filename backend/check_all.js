import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query('SELECT id, bride_name, groom_name, created_at FROM weddings ORDER BY created_at DESC LIMIT 10');
    fs.writeFileSync('db_out_all.json', JSON.stringify({ weddings: res.rows }, null, 2));
  } catch (err) {
    fs.writeFileSync('db_out_all.json', JSON.stringify({ error: err.message }));
  } finally {
    pool.end();
  }
}

run();
