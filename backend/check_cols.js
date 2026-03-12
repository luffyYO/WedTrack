import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL.replace(':6543', ':5432'),
  ssl: { rejectUnauthorized: false }
});

async function checkAllColumns() {
  try {
    console.log("Checking columns for 'weddings'...");
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'weddings';
    `);
    console.log("Columns found:");
    res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
  } catch (err) {
    console.error("Check failed:", err.message);
  } finally {
    await pool.end();
  }
}

checkAllColumns();
