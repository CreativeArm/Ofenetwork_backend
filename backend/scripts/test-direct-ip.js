const { Client } = require('pg');

async function testDirect() {
  const ips = ['34.241.16.247', '108.128.216.176', '52.209.89.87'];
  for (const host of ips) {
    for (const port of [6543, 5432]) {
      const client = new Client({
        host,
        port,
        user: 'postgres.sqghrsygxqleammpjjor',
        password: 'OfenetworksDb_2026!StrongPass',
        database: 'postgres',
        ssl: { rejectUnauthorized: false, servername: 'aws-0-eu-west-1.pooler.supabase.com' },
        connectionTimeoutMillis: 5000
      });
      try {
        await client.connect();
        const res = await client.query('SELECT count(*) FROM "User";');
        console.log(`✅ SUCCESS on ${host}:${port}! Total users in database: ${res.rows[0].count}`);
        const wallets = await client.query('SELECT count(*) FROM "Wallet";');
        console.log(`✅ Wallets: ${wallets.rows[0].count}`);
        const txs = await client.query('SELECT count(*) FROM "Transaction";');
        console.log(`✅ Transactions: ${txs.rows[0].count}`);
        await client.end();
        return;
      } catch (err) {
        console.log(`Fail ${host}:${port}: ${err.message}`);
      }
    }
  }
}

testDirect();
