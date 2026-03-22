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
    const res = await pool.query(`
      SELECT policyname, roles, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'weddings'
    `);
    fs.writeFileSync('policies_out.json', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    fs.writeFileSync('policies_out.json', JSON.stringify({ error: err.message }));
  } finally {
    pool.end();
  }
}
run();
