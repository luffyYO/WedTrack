import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres.knmqezafmenqghiheloi:nGH1iztbp7KX0n2E@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

const migrate = async () => {
  try {
    console.log("Connecting to Postgres...");
    
    // Add village column if it doesn't exist
    await pool.query(`
      ALTER TABLE weddings 
      ADD COLUMN IF NOT EXISTS village VARCHAR(255);
    `);
    console.log("Added 'village' column (or it already exists).");

    // Add extra_cell column if it doesn't exist
    await pool.query(`
      ALTER TABLE weddings 
      ADD COLUMN IF NOT EXISTS extra_cell VARCHAR(255);
    `);
    console.log("Added 'extra_cell' column (or it already exists).");

    // Add upi_id column if it doesn't exist
    await pool.query(`
      ALTER TABLE weddings 
      ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255);
    `);
    console.log("Added 'upi_id' column (or it already exists).");

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
};

migrate();
