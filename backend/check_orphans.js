import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL.replace(':6543', ':5432'),
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    console.log("Checking columns for 'weddings'...");
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'weddings'
    `);
    console.log("Columns found:", res.rows.map(r => r.column_name).join(', '));
  } catch (err) {
    console.error("Check failed:", err.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
