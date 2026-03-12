import pg from 'pg';
import dotenv from 'dotenv';
const { Client } = pg;
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL.replace(':6543', ':5432'),
  ssl: { rejectUnauthorized: false }
});

const KISHORE_ID = '333132bf-327f-449e-9951-9148473c1bba';

async function migrateData() {
  try {
    await client.connect();
    console.log(`Migrating orphaned weddings to ${KISHORE_ID}...`);
    
    const res = await client.query(`
      UPDATE weddings 
      SET user_id = $1 
      WHERE user_id IS NULL;
    `, [KISHORE_ID]);
    
    console.log(`Migration complete! Updated ${res.rowCount} weddings.`);
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

migrateData();
