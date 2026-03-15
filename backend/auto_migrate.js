import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log("Checking if 'qr_activation_time' exists...");
    const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'weddings' AND column_name = 'qr_activation_time'
    `);

    if (checkRes.rows.length === 0) {
      console.log("Adding 'qr_activation_time' column...");
      await pool.query(`ALTER TABLE weddings ADD COLUMN qr_activation_time TIMESTAMPTZ;`);
      console.log("Migration successful!");
    } else {
      console.log("'qr_activation_time' already exists.");
    }
  } catch (err) {
    console.error("MIGRATION ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

migrate();
