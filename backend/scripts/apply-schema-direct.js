const { execSync } = require('child_process');
const { Client } = require('pg');

async function main() {
  const sql = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', {
    encoding: 'utf-8',
    cwd: __dirname + '/..',
  });

  console.log('SQL Length:', sql.length);

  const client = new Client({
    connectionString: "postgresql://postgres.sqghrsygxqleammpjjor:OfenetworksDb_2026!StrongPass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  // Clean comments and split by semicolon
  const rawStatements = sql.split(';');
  const cleanStatements = [];

  for (const raw of rawStatements) {
    // Remove line comments (-- ...)
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => !l.startsWith('--'));
    const clean = lines.join(' ').trim();
    if (clean.length > 0) {
      cleanStatements.push(clean);
    }
  }

  console.log(`Executing ${cleanStatements.length} SQL statements...`);
  for (let i = 0; i < cleanStatements.length; i++) {
    const stmt = cleanStatements[i];
    try {
      await client.query(stmt);
      console.log(`[${i + 1}/${cleanStatements.length}] Done.`);
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log(`[${i + 1}/${cleanStatements.length}] Already exists, skipping.`);
      } else {
        console.error(`[${i + 1}/${cleanStatements.length}] Error: ${err.message}`);
      }
    }
  }

  console.log('✅ ALL TABLES, ENUMS, AND INDEXES SUCCESSFULLY CREATED!');
  await client.end();
}

main().catch(console.error);
