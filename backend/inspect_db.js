import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres.knmqezafmenqghiheloi:nGH1iztbp7KX0n2E@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    console.log("Checking weddings table schema...");
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'weddings';
    `);
    console.table(res.rows);
    
    console.log("\nChecking data in weddings table (first 5 rows)...");
    const dataRes = await pool.query(`
      SELECT id, bride_name, groom_name, user_id 
      FROM weddings 
      LIMIT 5;
    `);
    console.table(dataRes.rows);
  } catch (err) {
    console.error("Error checking schema:", err);
  } finally {
    await pool.end();
  }
}

checkSchema();
