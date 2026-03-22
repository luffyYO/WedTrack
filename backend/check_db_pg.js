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
    const res = await pool.query('SELECT * FROM weddings WHERE id = $1', ['350ea772-d8e7-41c8-a82d-0f44f1acad74']);
    fs.writeFileSync('db_out_pg.json', JSON.stringify({ wedding: res.rows }, null, 2));
  } catch (err) {
    fs.writeFileSync('db_out_pg.json', JSON.stringify({ error: err.message }));
  } finally {
    pool.end();
  }
}

run();
