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

function parseAndStandardize(dateStr) {
  if (!dateStr) return null;
  
  // If already ISO (YYYY-MM-DD), return as is
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.split('T')[0];

  const parts = dateStr.split(/[/\\-]/);
  if (parts.length === 3) {
    let day, month, year;
    if (parts[2].length === 4) {
      year = parts[2];
      const p1 = parseInt(parts[0]);
      const p2 = parseInt(parts[1]);

      if (p1 > 12) {
        // Definitely DD/MM/YYYY
        day = p1;
        month = p2;
      } else if (p2 > 12) {
        // Definitely MM/DD/YYYY
        month = p1;
        day = p2;
      } else {
        // Ambiguous. Default to MM/DD/YYYY as it was the legacy standard.
        month = p1;
        day = p2;
      }
      
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
}

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Starting date migration...");
    
    // 1. Fetch all weddings
    // Note: The column name is 'wedding_date' based on weddingController.js
    const weddings = await client.query('SELECT id, wedding_date, bride_name, groom_name FROM weddings');
    console.log(`Found ${weddings.rows.length} weddings.`);

    let updateCount = 0;
    for (const row of weddings.rows) {
      const originalDate = row.wedding_date;
      if (!originalDate) continue;

      const standardizedDate = parseAndStandardize(originalDate);
      
      if (standardizedDate && standardizedDate !== originalDate) {
        console.log(`Updating Wedding ${row.id} (${row.bride_name} & ${row.groom_name}): ${originalDate} -> ${standardizedDate}`);
        await client.query('UPDATE weddings SET wedding_date = $1 WHERE id = $2', [standardizedDate, row.id]);
        updateCount++;
      }
    }

    console.log(`Migration completed. ${updateCount} records updated.`);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
