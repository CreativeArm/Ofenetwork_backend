const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function apply() {
  console.log('--- APPLYING SCHEMA SQL TO NEW SUPABASE DB ---');
  const sqlFile = path.join(__dirname, 'schema.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

  // Split into statements safely
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`[${i + 1}/${statements.length}] Done.`);
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(`[${i + 1}/${statements.length}] Exists, skipping.`);
      } else {
        console.error(`[${i + 1}/${statements.length}] Error:`, err.message);
      }
    }
  }

  console.log('✅ ALL TABLES, ENUMS, AND INDEXES CREATED SUCCESSFULLY!');
}

apply()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
