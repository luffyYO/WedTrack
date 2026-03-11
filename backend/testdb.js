import pg from 'pg';
const { Client } = pg;

async function testConnection(name, url, sslConfig) {
  console.log(`\nTesting ${name}...`);
  const client = new Client({
    connectionString: url,
    ssl: sslConfig,
    connectionTimeoutMillis: 5000, // 5s timeout
  });

  try {
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log(`SUCCESS [${name}]:`, res.rows[0]);
    await client.end();
  } catch (err) {
    console.error(`FAILED [${name}]:`, err.message);
  }
}

async function main() {
  const password = 'nGH1iztbp7KX0n2E';
  const user = 'postgres.knmqezafmenqghiheloi';

  // 1. aws-1 port 6543 (from original .env)
  await testConnection(
    'aws-1 / 6543 / require',
    `postgresql://${user}:${password}@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres`,
    { rejectUnauthorized: false }
  );

  // 2. aws-0 port 5432 (Pooler direct)
  await testConnection(
    'aws-0 / 5432 / require',
    `postgresql://${user}:${password}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`,
    { rejectUnauthorized: false }
  );

  // 3. direct host port 5432 (Actual DB host, requires IPv6 or IPv4 Addon)
  await testConnection(
    'direct / 5432 / require',
    `postgresql://postgres:${password}@db.knmqezafmenqghiheloi.supabase.co:5432/postgres`,
    { rejectUnauthorized: false }
  );
}

main();
