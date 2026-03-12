import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL.replace(':6543', ':5432'), // Try direct port if pooler hangs
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000, // 10s timeout
});

const migrate = async () => {
  try {
    console.log("Connecting to Postgres using DATABASE_URL...");
    
    // Test connection first
    const testRes = await pool.query('SELECT NOW()');
    console.log("Connected successfully at:", testRes.rows[0].now);

    // Add village column if it doesn't exist
    await pool.query(`
      ALTER TABLE weddings 
      ADD COLUMN IF NOT EXISTS village VARCHAR(255);
    `);
    console.log("Added 'village' column.");

    // Add extra_cell column if it doesn't exist
    await pool.query(`
      ALTER TABLE weddings 
      ADD COLUMN IF NOT EXISTS extra_cell VARCHAR(255);
    `);
    console.log("Added 'extra_cell' column.");

    // Add user_id column if it doesn't exist
    await pool.query(`
      ALTER TABLE weddings 
      ADD COLUMN IF NOT EXISTS user_id UUID;
    `);
    console.log("Added 'user_id' column.");

    // Add upi_id column if it doesn't exist
    await pool.query(`
      ALTER TABLE weddings 
      ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255);
    `);
    console.log("Added 'upi_id' column.");

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed!");
    console.error("Error Message:", err.message);
    if (err.stack) console.error("Stack Trace:", err.stack);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

migrate();
