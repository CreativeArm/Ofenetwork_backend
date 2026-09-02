const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const connectionUrl = "postgresql://postgres.wxjvbavozghsxnaipjaq:OfenetworksDb_2026!StrongPass@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const prisma = new PrismaClient({ datasources: { db: { url: connectionUrl } } });

async function exportAll() {
  console.log('--- STARTING BACKUP OF SUPABASE DATABASE ---');
  
  const [
    users,
    wallets,
    walletCredits,
    transactions,
    buy4meOrders,
    exchangeRates,
    paymentMethods,
    testimonials,
    supportTickets,
    notifications,
    auditLogs
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.wallet.findMany(),
    prisma.walletCredit.findMany(),
    prisma.transaction.findMany(),
    prisma.buy4MeOrder.findMany(),
    prisma.exchangeRate.findMany(),
    prisma.paymentMethod.findMany(),
    prisma.testimonial.findMany(),
    prisma.supportTicket.findMany(),
    prisma.notification.findMany(),
    prisma.auditLog.findMany(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    sourceProject: "wxjvbavozghsxnaipjaq",
    counts: {
      users: users.length,
      wallets: wallets.length,
      walletCredits: walletCredits.length,
      transactions: transactions.length,
      buy4meOrders: buy4meOrders.length,
      exchangeRates: exchangeRates.length,
      paymentMethods: paymentMethods.length,
      testimonials: testimonials.length,
      supportTickets: supportTickets.length,
      notifications: notifications.length,
      auditLogs: auditLogs.length,
    },
    data: {
      users,
      wallets,
      walletCredits,
      transactions,
      buy4meOrders,
      exchangeRates,
      paymentMethods,
      testimonials,
      supportTickets,
      notifications,
      auditLogs,
    },
  };

  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filename = `supabase_backup_${Date.now()}.json`;
  const filePath = path.join(backupDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf-8');

  console.log('✅ BACKUP COMPLETE!');
  console.log('Saved to:', filePath);
  console.log('Summary of backed-up records:');
  console.log(JSON.stringify(backup.counts, null, 2));
}

exportAll()
  .catch((err) => {
    console.error('❌ Export failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
