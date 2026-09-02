const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const transactions = await prisma.transaction.count();
  const wallets = await prisma.wallet.count();
  const walletCredits = await prisma.walletCredit.count();
  const buy4meOrders = await prisma.buy4MeOrder.count();
  const exchangeRates = await prisma.exchangeRate.count();
  const paymentMethods = await prisma.paymentMethod.count();
  const supportTickets = await prisma.supportTicket.count();
  const testimonials = await prisma.testimonial.count();
  const notifications = await prisma.notification.count();
  const auditLogs = await prisma.auditLog.count();

  console.log('Current Database Row Counts:');
  console.log(JSON.stringify({
    users,
    transactions,
    wallets,
    walletCredits,
    buy4meOrders,
    exchangeRates,
    paymentMethods,
    supportTickets,
    testimonials,
    notifications,
    auditLogs,
  }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
