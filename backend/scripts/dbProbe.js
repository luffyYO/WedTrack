import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function probe() {
  const client = await pool.connect();
  try {
    console.log("Probing database...");
    
    const tables = ['weddings', 'guests'];
    for (const table of tables) {
      console.log(`\nTable: ${table}`);
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [table]);
      
      res.rows.forEach(col => {
        console.log(` - ${col.column_name}: ${col.data_type}`);
      });
    }

  } catch (err) {
    console.error("Probe failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

probe();
