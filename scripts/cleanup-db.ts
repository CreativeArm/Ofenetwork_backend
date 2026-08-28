import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database cleanup for launch...");

  // 1. Identify users to keep (Admin accounts or ayandokunamos@gmail.com)
  const usersToKeep = await prisma.user.findMany({
    where: {
      OR: [
        { role: "ADMIN" },
        { email: { equals: "ayandokunamos@gmail.com", mode: "insensitive" } },
      ],
    },
    select: { id: true, email: true, role: true },
  });

  const keepUserIds = usersToKeep.map((u) => u.id);
  console.log(
    `Preserving ${usersToKeep.length} user account(s):`,
    usersToKeep.map((u) => `${u.email} (${u.role})`).join(", "),
  );

  // 2. Delete transactional data
  const deletedTx = await prisma.transaction.deleteMany({});
  console.log(`Deleted ${deletedTx.count} transaction(s).`);

  const deletedB4m = await prisma.buy4MeOrder.deleteMany({});
  console.log(`Deleted ${deletedB4m.count} Buy 4 Me order(s).`);

  const deletedTickets = await prisma.supportTicket.deleteMany({});
  console.log(`Deleted ${deletedTickets.count} support ticket(s).`);

  const deletedTestimonials = await prisma.testimonial.deleteMany({});
  console.log(`Deleted ${deletedTestimonials.count} testimonial(s).`);

  const deletedNotifications = await prisma.notification.deleteMany({});
  console.log(`Deleted ${deletedNotifications.count} notification(s).`);

  const deletedAuditLogs = await prisma.auditLog.deleteMany({});
  console.log(`Deleted ${deletedAuditLogs.count} audit log(s).`);

  const deletedCredits = await prisma.walletCredit.deleteMany({});
  console.log(`Deleted ${deletedCredits.count} wallet credit(s).`);

  // 3. Delete non-preserved wallets & users
  const deletedWallets = await prisma.wallet.deleteMany({
    where: {
      userId: {
        notIn: keepUserIds,
      },
    },
  });
  console.log(`Deleted ${deletedWallets.count} non-admin wallet(s).`);

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: {
        notIn: keepUserIds,
      },
    },
  });
  console.log(`Deleted ${deletedUsers.count} non-admin user account(s).`);

  console.log("Database cleanup completed successfully!");
}

main()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
