const { Client } = require('pg');

async function analyzeDatabaseSizes() {
  const ips = ['18.202.64.2', '54.247.26.119', '54.229.189.117'];
  let client;
  for (const host of ips) {
    client = new Client({
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
      console.log(`Connected to database on ${host}!`);
      break;
    } catch (e) {
      console.log(`Failed ${host}: ${e.message}`);
    }
  }

  console.log('\n--- ANALYZING DATABASE PAYLOAD SIZES ---');

  // Query Users
  const userRes = await client.query('SELECT id, email, length("profileImageUrl") as img_len, length("kycDocumentUrl") as kyc_len, substring("kycDocumentUrl", 1, 15) as kyc_start, substring("profileImageUrl", 1, 15) as img_start FROM "User";');
  let totalUserBytes = 0;
  console.log('\n--- USERS ---');
  for (const u of userRes.rows) {
    const kycLen = parseInt(u.kyc_len || '0', 10);
    const imgLen = parseInt(u.img_len || '0', 10);
    totalUserBytes += kycLen + imgLen;
    console.log(`User: ${u.email.padEnd(30)} | KYC: ${(kycLen / 1024 / 1024).toFixed(2)} MB (${u.kyc_start || 'null'}) | Img: ${(imgLen / 1024 / 1024).toFixed(2)} MB (${u.img_start || 'null'})`);
  }

  // Query Transactions
  const txRes = await client.query('SELECT id, type, length("proofOfPaymentUrl") as proof_len, substring("proofOfPaymentUrl", 1, 15) as proof_start FROM "Transaction";');
  let totalTxBytes = 0;
  console.log('\n--- TRANSACTIONS ---');
  for (const t of txRes.rows) {
    const proofLen = parseInt(t.proof_len || '0', 10);
    totalTxBytes += proofLen;
    console.log(`Tx: ${t.id} (${t.type}) | Proof: ${(proofLen / 1024 / 1024).toFixed(2)} MB (${t.proof_start || 'null'})`);
  }

  // Query Buy4Me
  const orderRes = await client.query('SELECT id, length("proofOfPaymentUrl") as proof_len FROM "Buy4MeOrder";');
  let totalOrderBytes = 0;
  for (const o of orderRes.rows) {
    totalOrderBytes += parseInt(o.proof_len || '0', 10);
  }

  console.log('\n=============================================');
  console.log(`TOTAL PAYLOAD DATA STORED IN DATABASE:`);
  console.log(`- User KYC + Avatar columns: ${(totalUserBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Transaction Proof columns: ${(totalTxBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Buy4Me Proof columns: ${(totalOrderBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- TOTAL PER FULL SCAN: ${((totalUserBytes + totalTxBytes + totalOrderBytes) / 1024 / 1024).toFixed(2)} MB`);
  console.log('=============================================');

  await client.end();
}

analyzeDatabaseSizes().catch(console.error);
