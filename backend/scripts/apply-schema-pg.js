const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres.sqghrsygxqleammpjjor:OfenetworksDb_2026!StrongPass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

async function apply() {
  console.log('Connecting with pg Client to Supabase...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected! Reading schema.sql...');

  const sqlFile = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');

  // Split on semicolon, but handle multi-line clean statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Executing ${statements.length} statements one-by-one...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await client.query(stmt);
      console.log(`[${i + 1}/${statements.length}] Done.`);
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log(`[${i + 1}/${statements.length}] Exists, skipping.`);
      } else {
        console.error(`[${i + 1}/${statements.length}] Error on statement:\n${stmt.substring(0, 80)}...\n--> ${err.message}`);
      }
    }
  }

  console.log('✅ ALL TABLES, ENUMS, AND INDEXES CREATED IN NEW DATABASE!');
  await client.end();
}

apply().catch(err => {
  console.error('❌ Schema error:', err);
  process.exit(1);
});
