const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const allRates = await prisma.exchangeRate.findMany();
  console.log("Initial rates:", allRates);
  
  if (allRates.length > 0) {
    const rate = allRates[0];
    console.log("Updating rate:", rate.id, rate.service);
    
    const updated = await prisma.exchangeRate.update({
      where: { id: rate.id },
      data: { depositRate: "Updated N1,000 / $1" }
    });
    console.log("Updated response:", updated);

    console.log("Now running upsert with empty update...");
    const upserted = await prisma.exchangeRate.upsert({
      where: { service: rate.service },
      update: {},
      create: {
        service: rate.service,
        depositRate: "DEFAULT_DEPOSIT",
        withdrawalRate: "DEFAULT_WITHDRAWAL",
        sortOrder: 0
      }
    });
    console.log("Upserted response:", upserted);

    const check = await prisma.exchangeRate.findUnique({ where: { id: rate.id } });
    console.log("Final record:", check);
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
