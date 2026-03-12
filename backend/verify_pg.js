import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL.replace(':6543', ':5432'),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000
});

async function verifyColumn() {
  try {
    console.log("Checking columns via PG...");
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'weddings' AND column_name = 'user_id';
    `);
    
    if (res.rows.length > 0) {
      console.log("SUCCESS: 'user_id' column exists with type:", res.rows[0].data_type);
    } else {
      console.log("FAILURE: 'user_id' column NOT found in weddings table.");
      
      console.log("All columns in 'weddings':");
      const allCols = await pool.query(`
        SELECT column_name FROM information_schema.columns WHERE table_name = 'weddings';
      `);
      console.log(allCols.rows.map(r => r.column_name).join(', '));
    }
  } catch (err) {
    console.error("PG Query Error:", err.message);
  } finally {
    await pool.end();
  }
}

verifyColumn();
