import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function diagnose() {
  console.log('--- DB DIAGNOSIS START ---');
  try {
    console.log('1. Testing raw connection...');
    const now = await pool.query('SELECT NOW()');
    console.log('Success - DB Time:', now.rows[0].now);

    console.log('2. Checking table columns for "weddings"...');
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'weddings'
      ORDER BY ordinal_position
    `);
    
    if (cols.rows.length === 0) {
      console.log('ERROR: Table "weddings" not found in information_schema!');
    } else {
      console.log('Columns found:');
      cols.rows.forEach(row => {
        console.log(` - ${row.column_name} (${row.data_type})`);
      });
      
      const hasCol = cols.rows.some(r => r.column_name === 'qr_activation_time');
      console.log('RESULT: qr_activation_time EXISTS?', hasCol ? 'YES' : 'NO');
    }

  } catch (err) {
    console.error('DIAGNOSIS FATAL ERROR:', err.message);
  } finally {
    await pool.end();
    console.log('--- DB DIAGNOSIS END ---');
  }
}

diagnose();
