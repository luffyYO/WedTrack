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
    const res = await pool.query('SELECT id, bride_name, groom_name FROM weddings WHERE id = $1', ['c02bed0b-bbad-4e63-860d-f9ef7cad0765']);
    const policies = await pool.query("SELECT * FROM pg_policies WHERE tablename = 'weddings'");
    
    fs.writeFileSync('db_out.json', JSON.stringify({
      wedding: res.rows,
      policies: policies.rows
    }, null, 2));
    
  } catch (err) {
    fs.writeFileSync('db_out.json', JSON.stringify({ error: err.message }));
  } finally {
    pool.end();
  }
}

run();
