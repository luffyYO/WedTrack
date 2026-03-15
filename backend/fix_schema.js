import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function run() {
  try {
    console.log("Connecting to Supabase Postgres...");
    // 1. Check if column exists
    const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'weddings' AND column_name = 'qr_activation_time'
    `);

    if (checkRes.rows.length === 0) {
      console.log("Column 'qr_activation_time' NOT found. Adding it now...");
      await pool.query(`ALTER TABLE weddings ADD COLUMN qr_activation_time TIMESTAMPTZ;`);
      console.log("Column added successfully!");
    } else {
      console.log("Column 'qr_activation_time' already exists in DB.");
    }

    // 2. Force schema cache reload (PostgREST specific)
    console.log("Attempting to reload Supabase schema cache...");
    await pool.query("NOTIFY pgrst, 'reload schema'");
    console.log("Reload signal sent.");

  } catch (err) {
    console.error("FATAL ERROR:", err.message);
  } finally {
    await pool.end();
    process.exit();
  }
}

run();
