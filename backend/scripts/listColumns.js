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

async function listColumns() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'weddings'
    `);

    console.log("COLUMNS_START");
    res.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });
    console.log("COLUMNS_END");

  } catch (err) {
    console.error("List failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

listColumns();
