import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
const { Client } = pg;
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL.replace(':6543', ':5432'),
  ssl: { rejectUnauthorized: false }
});

async function findUsers() {
  let output = "";
  try {
    await client.connect();
    output += "Fetching users from auth.users...\n";
    const res = await client.query(`
      SELECT id, email, created_at, last_sign_in_at 
      FROM auth.users 
      ORDER BY created_at ASC;
    `);
    output += "Users found:\n";
    res.rows.forEach(r => {
      output += `- ID: ${r.id}, Email: ${r.email}, Last login: ${r.last_sign_in_at}\n`;
    });
  } catch (err) {
    output += `Failed to fetch users: ${err.message}\n`;
  } finally {
    await client.end();
    fs.writeFileSync('users_debug.txt', output);
    console.log("User list written to users_debug.txt");
    process.exit(0);
  }
}

findUsers();
