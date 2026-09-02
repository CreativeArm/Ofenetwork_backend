const { PrismaClient } = require('@prisma/client');

async function testConnection(url) {
  console.log('Testing URL:', url.replace(/:[^:@]+@/, ':****@'));
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('✅ SUCCESS! Connection established:', res);
    return true;
  } catch (err) {
    console.log('❌ Failed:', err.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const urls = [
    "postgresql://postgres.sqghrsygxqleammpjjor:OfenetworksDb_2026!StrongPass@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    "postgresql://postgres.sqghrsygxqleammpjjor:OfenetworksDb_2026!StrongPass@aws-0-eu-west-1.pooler.supabase.com:5432/postgres",
    "postgresql://postgres.sqghrsygxqleammpjjor:OfenetworksDb_2026!StrongPass@aws-1-eu-west-1.pooler.supabase.com:5432/postgres",
    "postgresql://postgres.sqghrsygxqleammpjjor:OfenetworksDb_2026!StrongPass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    "postgresql://postgres:OfenetworksDb_2026!StrongPass@db.sqghrsygxqleammpjjor.supabase.co:5432/postgres",
  ];

  for (const u of urls) {
    if (await testConnection(u)) {
      console.log('WORKING URL FOUND:', u);
      break;
    }
  }
}

run();
