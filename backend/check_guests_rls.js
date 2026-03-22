import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const res = await pool.query("SELECT count(*) FROM guests");
    console.log("Total guests in DB:", res.rows[0].count);
    
    const policies = await pool.query("SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'guests'");
    console.log("RLS Policies on guests:", policies.rows);
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    pool.end();
  }
}
check();
