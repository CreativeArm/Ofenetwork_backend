const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Automatically loads the latest backup from backend/backups
async function importAll() {
  const prisma = new PrismaClient();
  console.log('--- STARTING IMPORT TO NEW DATABASE ---');

  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    console.error('❌ No backups directory found at:', backupDir);
    process.exit(1);
  }

  const files = fs.readdirSync(backupDir).filter(f => f.startsWith('supabase_backup_') && f.endsWith('.json'));
  if (files.length === 0) {
    console.error('❌ No backup JSON files found in:', backupDir);
    process.exit(1);
  }

  // Sort by name (timestamp) descending to pick latest
  files.sort().reverse();
  const latestFile = path.join(backupDir, files[0]);
  console.log('Loading backup file:', latestFile);

  const raw = fs.readFileSync(latestFile, 'utf-8');
  const backup = JSON.parse(raw);
  const { data } = backup;

  console.log('Inserting records in correct dependency order...');

  // 1. Users
  if (data.users && data.users.length > 0) {
    console.log(`Importing ${data.users.length} Users...`);
    for (const u of data.users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: u,
        create: u,
      });
    }
  }

  // 2. Wallets
  if (data.wallets && data.wallets.length > 0) {
    console.log(`Importing ${data.wallets.length} Wallets...`);
    for (const w of data.wallets) {
      await prisma.wallet.upsert({
        where: { id: w.id },
        update: w,
        create: w,
      });
    }
  }

  // 3. Wallet Credits
  if (data.walletCredits && data.walletCredits.length > 0) {
    console.log(`Importing ${data.walletCredits.length} Wallet Credits...`);
    for (const c of data.walletCredits) {
      await prisma.walletCredit.upsert({
        where: { id: c.id },
        update: c,
        create: c,
      });
    }
  }

  // 4. Transactions
  if (data.transactions && data.transactions.length > 0) {
    console.log(`Importing ${data.transactions.length} Transactions...`);
    for (const t of data.transactions) {
      await prisma.transaction.upsert({
        where: { id: t.id },
        update: t,
        create: t,
      });
    }
  }

  // 5. Buy4Me Orders
  if (data.buy4meOrders && data.buy4meOrders.length > 0) {
    console.log(`Importing ${data.buy4meOrders.length} Buy4Me Orders...`);
    for (const b of data.buy4meOrders) {
      await prisma.buy4MeOrder.upsert({
        where: { id: b.id },
        update: b,
        create: b,
      });
    }
  }

  // 6. Exchange Rates
  if (data.exchangeRates && data.exchangeRates.length > 0) {
    console.log(`Importing ${data.exchangeRates.length} Exchange Rates...`);
    for (const r of data.exchangeRates) {
      await prisma.exchangeRate.upsert({
        where: { service: r.service },
        update: r,
        create: r,
      });
    }
  }

  // 7. Payment Methods
  if (data.paymentMethods && data.paymentMethods.length > 0) {
    console.log(`Importing ${data.paymentMethods.length} Payment Methods...`);
    for (const p of data.paymentMethods) {
      await prisma.paymentMethod.upsert({
        where: { channel: p.channel },
        update: p,
        create: p,
      });
    }
  }

  // 8. Testimonials
  if (data.testimonials && data.testimonials.length > 0) {
    console.log(`Importing ${data.testimonials.length} Testimonials...`);
    for (const tm of data.testimonials) {
      await prisma.testimonial.upsert({
        where: { id: tm.id },
        update: tm,
        create: tm,
      });
    }
  }

  // 9. Support Tickets
  if (data.supportTickets && data.supportTickets.length > 0) {
    console.log(`Importing ${data.supportTickets.length} Support Tickets...`);
    for (const st of data.supportTickets) {
      await prisma.supportTicket.upsert({
        where: { id: st.id },
        update: st,
        create: st,
      });
    }
  }

  // 10. Notifications
  if (data.notifications && data.notifications.length > 0) {
    console.log(`Importing ${data.notifications.length} Notifications...`);
    for (const n of data.notifications) {
      await prisma.notification.upsert({
        where: { id: n.id },
        update: n,
        create: n,
      });
    }
  }

  // 11. Audit Logs
  if (data.auditLogs && data.auditLogs.length > 0) {
    console.log(`Importing ${data.auditLogs.length} Audit Logs...`);
    for (const a of data.auditLogs) {
      await prisma.auditLog.upsert({
        where: { id: a.id },
        update: a,
        create: a,
      });
    }
  }

  console.log('🎉 ALL DATA SUCCESSFULLY RESTORED TO NEW DATABASE!');
  await prisma.$disconnect();
}

importAll().catch(err => {
  console.error('❌ Import error:', err);
  process.exit(1);
});
