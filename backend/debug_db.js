import pg from 'pg';
const { Pool } = pg;

import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Listing columns for 'weddings'...");
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'weddings'
    `);
    console.log("Columns:", res.rows.map(r => r.column_name).join(', '));
  } catch (err) {
    console.error("DEBUG ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

main();
