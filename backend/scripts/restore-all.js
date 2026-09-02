const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const connectionUrl = "postgresql://postgres.sqghrsygxqleammpjjor:OfenetworksDb_2026!StrongPass@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const prisma = new PrismaClient({ datasources: { db: { url: connectionUrl } } });

function parseDates(obj) {
  if (!obj) return obj;
  const result = { ...obj };
  for (const [key, val] of Object.entries(result)) {
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      result[key] = new Date(val);
    }
  }
  return result;
}

async function restore() {
  console.log('--- STARTING COMPLETE RESTORATION ---');
  const backupDir = path.join(__dirname, '..', 'backups');
  const files = fs.readdirSync(backupDir).filter(f => f.startsWith('supabase_backup_') && f.endsWith('.json'));
  files.sort().reverse();
  const latestFile = path.join(backupDir, files[0]);
  console.log('Using backup file:', latestFile);

  const raw = fs.readFileSync(latestFile, 'utf-8');
  const { data } = JSON.parse(raw);

  // 1. Users
  console.log(`\n1. Restoring ${data.users.length} Users...`);
  for (let i = 0; i < data.users.length; i++) {
    const u = parseDates(data.users[i]);
    await prisma.user.upsert({
      where: { id: u.id },
      update: u,
      create: u,
    });
    console.log(`[${i + 1}/${data.users.length}] User restored: ${u.email}`);
  }

  // 2. Wallets
  console.log(`\n2. Restoring ${data.wallets.length} Wallets...`);
  for (let i = 0; i < data.wallets.length; i++) {
    const w = parseDates(data.wallets[i]);
    await prisma.wallet.upsert({
      where: { id: w.id },
      update: w,
      create: w,
    });
    console.log(`[${i + 1}/${data.wallets.length}] Wallet restored: ${w.id}`);
  }

  // 3. Wallet Credits
  console.log(`\n3. Restoring ${data.walletCredits.length} Wallet Credits...`);
  for (let i = 0; i < data.walletCredits.length; i++) {
    const c = parseDates(data.walletCredits[i]);
    await prisma.walletCredit.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });
    console.log(`[${i + 1}/${data.walletCredits.length}] Credit restored: ${c.id}`);
  }

  // 4. Transactions
  console.log(`\n4. Restoring ${data.transactions.length} Transactions...`);
  for (let i = 0; i < data.transactions.length; i++) {
    const t = parseDates(data.transactions[i]);
    await prisma.transaction.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
    console.log(`[${i + 1}/${data.transactions.length}] Transaction restored: ${t.id} (${t.type})`);
  }

  // 5. Buy4Me Orders
  if (data.buy4meOrders && data.buy4meOrders.length > 0) {
    console.log(`\n5. Restoring ${data.buy4meOrders.length} Buy4Me Orders...`);
    for (const b of data.buy4meOrders) {
      const order = parseDates(b);
      await prisma.buy4MeOrder.upsert({
        where: { id: order.id },
        update: order,
        create: order,
      });
    }
  }

  // 6. Exchange Rates
  console.log(`\n6. Restoring ${data.exchangeRates.length} Exchange Rates...`);
  for (let i = 0; i < data.exchangeRates.length; i++) {
    const r = parseDates(data.exchangeRates[i]);
    await prisma.exchangeRate.upsert({
      where: { service: r.service },
      update: r,
      create: r,
    });
    console.log(`[${i + 1}/${data.exchangeRates.length}] Rate restored: ${r.service}`);
  }

  // 7. Payment Methods
  if (data.paymentMethods && data.paymentMethods.length > 0) {
    console.log(`\n7. Restoring ${data.paymentMethods.length} Payment Methods...`);
    for (const p of data.paymentMethods) {
      const pm = parseDates(p);
      await prisma.paymentMethod.upsert({
        where: { channel: pm.channel },
        update: pm,
        create: pm,
      });
    }
  }

  // 8. Testimonials
  console.log(`\n8. Restoring ${data.testimonials.length} Testimonials...`);
  for (let i = 0; i < data.testimonials.length; i++) {
    const tm = parseDates(data.testimonials[i]);
    await prisma.testimonial.upsert({
      where: { id: tm.id },
      update: tm,
      create: tm,
    });
    console.log(`[${i + 1}/${data.testimonials.length}] Testimonial restored: ${tm.name}`);
  }

  // 9. Support Tickets
  if (data.supportTickets && data.supportTickets.length > 0) {
    console.log(`\n9. Restoring ${data.supportTickets.length} Support Tickets...`);
    for (const st of data.supportTickets) {
      const ticket = parseDates(st);
      await prisma.supportTicket.upsert({
        where: { id: ticket.id },
        update: ticket,
        create: ticket,
      });
    }
  }

  // 10. Notifications
  console.log(`\n10. Restoring ${data.notifications.length} Notifications...`);
  for (let i = 0; i < data.notifications.length; i++) {
    const n = parseDates(data.notifications[i]);
    await prisma.notification.upsert({
      where: { id: n.id },
      update: n,
      create: n,
    });
  }
  console.log(`✅ All ${data.notifications.length} notifications restored.`);

  // 11. Audit Logs
  console.log(`\n11. Restoring ${data.auditLogs.length} Audit Logs...`);
  for (let i = 0; i < data.auditLogs.length; i++) {
    const a = parseDates(data.auditLogs[i]);
    await prisma.auditLog.upsert({
      where: { id: a.id },
      update: a,
      create: a,
    });
  }
  console.log(`✅ All ${data.auditLogs.length} audit logs restored.`);

  console.log('\n========================================');
  console.log('🎉 100% OF DATABASE RESTORED TO NEW SUPABASE PROJECT!');
  console.log('========================================');
  await prisma.$disconnect();
}

restore().catch(err => {
  console.error('❌ Restoration failed:', err);
  process.exit(1);
});
