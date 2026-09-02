const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const connectionUrl = "postgresql://postgres.sqghrsygxqleammpjjor:OfenetworksDb_2026!StrongPass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const prisma = new PrismaClient({ datasources: { db: { url: connectionUrl } } });

function parseDates(obj) {
  const result = { ...obj };
  for (const [key, val] of Object.entries(result)) {
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      result[key] = new Date(val);
    }
  }
  return result;
}

async function testOne() {
  const backupDir = path.join(__dirname, '..', 'backups');
  const files = fs.readdirSync(backupDir).filter(f => f.startsWith('supabase_backup_') && f.endsWith('.json'));
  files.sort().reverse();
  const raw = fs.readFileSync(path.join(backupDir, files[0]), 'utf-8');
  const { data } = JSON.parse(raw);

  const u = parseDates(data.users[0]);
  console.log('Inserting user:', u.email);
  const created = await prisma.user.upsert({
    where: { id: u.id },
    update: u,
    create: u,
  });
  console.log('Created successfully:', created.id, created.email);
  await prisma.$disconnect();
}

testOne().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
