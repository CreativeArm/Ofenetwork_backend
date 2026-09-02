const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const connectionUrl = "postgresql://postgres.sqghrsygxqleammpjjor:OfenetworksDb_2026!StrongPass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const prisma = new PrismaClient({ datasources: { db: { url: connectionUrl } } });

async function run() {
  console.log('Connecting via Prisma Client to port 6543 (?pgbouncer=true)...');
  const backupDir = path.join(__dirname, '..', 'backups');
  const files = fs.readdirSync(backupDir).filter(f => f.startsWith('supabase_backup_') && f.endsWith('.json'));
  files.sort().reverse();
  const latestFile = path.join(backupDir, files[0]);
  console.log('Using backup file:', latestFile);

  const raw = fs.readFileSync(latestFile, 'utf-8');
  const { data } = JSON.parse(raw);

  // 1. Users
  console.log(`Restoring ${data.users.length} Users...`);
  for (const u of data.users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: u,
      create: u,
    });
    console.log(`User [${u.email}] restored.`);
  }

  // 2. Wallets
  console.log(`Restoring ${data.wallets.length} Wallets...`);
  for (const w of data.wallets) {
    await prisma.wallet.upsert({
      where: { id: w.id },
      update: w,
      create: w,
    });
  }

  // 3. Wallet Credits
  console.log(`Restoring ${data.walletCredits.length} Wallet Credits...`);
  for (const c of data.walletCredits) {
    await prisma.walletCredit.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });
  }

  // 4. Transactions
  console.log(`Restoring ${data.transactions.length} Transactions...`);
  for (const t of data.transactions) {
    await prisma.transaction.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }

  // 5. Buy4Me Orders
  console.log(`Restoring ${data.buy4meOrders.length} Buy4Me Orders...`);
  for (const b of data.buy4meOrders) {
    await prisma.buy4MeOrder.upsert({
      where: { id: b.id },
      update: b,
      create: b,
    });
  }

  // 6. Exchange Rates
  console.log(`Restoring ${data.exchangeRates.length} Exchange Rates...`);
  for (const r of data.exchangeRates) {
    await prisma.exchangeRate.upsert({
      where: { service: r.service },
      update: r,
      create: r,
    });
  }

  // 7. Payment Methods
  console.log(`Restoring ${data.paymentMethods.length} Payment Methods...`);
  for (const p of data.paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { channel: p.channel },
      update: p,
      create: p,
    });
  }

  // 8. Testimonials
  console.log(`Restoring ${data.testimonials.length} Testimonials...`);
  for (const tm of data.testimonials) {
    await prisma.testimonial.upsert({
      where: { id: tm.id },
      update: tm,
      create: tm,
    });
  }

  // 9. Support Tickets
  console.log(`Restoring ${data.supportTickets.length} Support Tickets...`);
  for (const st of data.supportTickets) {
    await prisma.supportTicket.upsert({
      where: { id: st.id },
      update: st,
      create: st,
    });
  }

  // 10. Notifications
  console.log(`Restoring ${data.notifications.length} Notifications...`);
  for (const n of data.notifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: n,
      create: n,
    });
  }

  // 11. Audit Logs
  console.log(`Restoring ${data.auditLogs.length} Audit Logs...`);
  for (const a of data.auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: a.id },
      update: a,
      create: a,
    });
  }

  console.log('\n🎉 ALL 100% OF DATA SUCCESSFULLY RESTORED!');
  await prisma.$disconnect();
}

run().catch(console.error);
