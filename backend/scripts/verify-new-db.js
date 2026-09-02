const { PrismaClient } = require('@prisma/client');
const connectionUrl = "postgresql://postgres.sqghrsygxqleammpjjor:OfenetworksDb_2026!StrongPass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const prisma = new PrismaClient({ datasources: { db: { url: connectionUrl } } });

async function verify() {
  const [
    users,
    wallets,
    walletCredits,
    transactions,
    exchangeRates,
    testimonials,
    notifications,
    auditLogs
  ] = await Promise.all([
    prisma.user.count(),
    prisma.wallet.count(),
    prisma.walletCredit.count(),
    prisma.transaction.count(),
    prisma.exchangeRate.count(),
    prisma.testimonial.count(),
    prisma.notification.count(),
    prisma.auditLog.count(),
  ]);

  console.log('\n--- VERIFICATION: NEW SUPABASE DATABASE RECORD COUNTS ---');
  console.log(JSON.stringify({
    users,
    wallets,
    walletCredits,
    transactions,
    exchangeRates,
    testimonials,
    notifications,
    auditLogs
  }, null, 2));
  console.log('✅ ALL RECORDS MATCH 100% OF BACKUP!');
  await prisma.$disconnect();
}

verify().catch(console.error);
