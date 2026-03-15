import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'weddings'
    `);
    const cols = res.rows.map(r => r.column_name);
    console.log('COLUMNS_FOUND:' + cols.join(','));
  } catch (err) {
    console.log('QUERY_ERROR:' + err.message);
  } finally {
    await pool.end();
  }
}
check();
