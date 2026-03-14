import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected successfully.");

    console.log("Adding gift_side column to guests table if not exists...");
    await client.query(`
      ALTER TABLE guests 
      ADD COLUMN IF NOT EXISTS gift_side TEXT;
    `);
    console.log("Column check/add done.");

    console.log("Adding check constraint for gift_side values...");
    try {
        await client.query(`
            ALTER TABLE guests
            ADD CONSTRAINT check_gift_side CHECK (gift_side IN ('bride', 'groom'));
        `);
        console.log("Check constraint added successfully.");
    } catch (constraintErr) {
        if (constraintErr.code === '42710') { // duplicate_object
            console.log("Check constraint already exists.");
        } else {
            console.error("Warning while adding constraint:", constraintErr.message);
        }
    }

  } catch (err) {
    console.error("MIGRATION_ERROR:", err.message);
  } finally {
    await client.end();
  }
}

migrate();
