import pg from 'pg';
import dotenv from 'dotenv';
const { Client } = pg;
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL.replace(':6543', ':5432'),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000
});

async function runMigration() {
  try {
    console.log("Connecting...");
    await client.connect();
    console.log("Connected! Running ALTER TABLE...");
    
    await client.query("ALTER TABLE weddings ADD COLUMN IF NOT EXISTS user_id UUID;");
    console.log("Executed: weddings.user_id added.");
    
    await client.query("ALTER TABLE weddings ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255);");
    console.log("Executed: weddings.upi_id added.");
    
    console.log("Migration finished.");
  } catch (err) {
    console.error("MIGRATION FAILED!");
    console.error("Name:", err.name);
    console.error("Message:", err.message);
    console.error("Code:", err.code);
  } finally {
    await client.end();
    process.exit(0);
  }
}

runMigration();
