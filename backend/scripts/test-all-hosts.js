const { Client } = require('pg');

const hosts = [
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-1-eu-west-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-1-eu-central-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-1-us-east-1.pooler.supabase.com'
];

async function testAll() {
  for (const host of hosts) {
    for (const port of [6543, 5432]) {
      const client = new Client({
        host,
        port,
        user: 'postgres.sqghrsygxqleammpjjor',
        password: 'OfenetworksDb_2026!StrongPass',
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 4000
      });
      try {
        await client.connect();
        const res = await client.query('SELECT count(*) FROM "User";');
        console.log(` SUCCESS on ${host}:${port} -> User count: ${res.rows[0].count}`);
        await client.end();
        return;
      } catch (err) {
        console.log(`Fail ${host}:${port}: ${err.message}`);
      }
    }
  }
}

testAll();
