const { Client } = require('pg');

async function testConn() {
  const ips = ['18.202.64.2', '54.247.26.119', '54.229.189.117'];
  for (const host of ips) {
    console.log(`Connecting to ${host}:6543...`);
    const client = new Client({
      host,
      port: 6543,
      user: 'postgres.sqghrsygxqleammpjjor',
      password: 'OfenetworksDb_2026!StrongPass',
      database: 'postgres',
      ssl: { rejectUnauthorized: false, servername: 'aws-1-eu-west-1.pooler.supabase.com' },
      connectionTimeoutMillis: 10000
    });
    try {
      await client.connect();
      console.log(' Connected!');
      const userRes = await client.query('SELECT count(*) FROM "User";');
      const walletRes = await client.query('SELECT count(*) FROM "Wallet";');
      const txRes = await client.query('SELECT count(*) FROM "Transaction";');
      const rateRes = await client.query('SELECT count(*) FROM "ExchangeRate";');
      console.log('\n=======================================');
      console.log('🎉 LIVE DATABASE STATS:');
      console.log(`  Users: ${userRes.rows[0].count}`);
      console.log(`  Wallets: ${walletRes.rows[0].count}`);
      console.log(`  Transactions: ${txRes.rows[0].count}`);
      console.log(`  Exchange Rates: ${rateRes.rows[0].count}`);
      console.log('=======================================\n');
      await client.end();
      return;
    } catch (err) {
      console.log(`Error on ${host}: ${err.message}`);
    }
  }
}

testConn();
