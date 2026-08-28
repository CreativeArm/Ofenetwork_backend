const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const users = await prisma.user.findMany();
  console.log('TOTAL USERS IN DB:', users.length);
  console.log('USERS:', JSON.stringify(users.map(u => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    status: u.status,
    kycStatus: u.kycStatus,
    kycDocumentType: u.kycDocumentType,
    kycDocumentUrl: u.kycDocumentUrl ? u.kycDocumentUrl.substring(0, 50) + '...' : null,
    kycSubmittedAt: u.kycSubmittedAt,
    createdAt: u.createdAt
  })), null, 2));

  const transactions = await prisma.transaction.findMany();
  console.log('TOTAL TRANSACTIONS IN DB:', transactions.length);

  const buy4me = await prisma.buy4MeOrder.findMany();
  console.log('TOTAL BUY4ME IN DB:', buy4me.length);

  const tickets = await prisma.supportTicket.findMany();
  console.log('TOTAL TICKETS IN DB:', tickets.length);

  const testimonials = await prisma.testimonial.findMany();
  console.log('TOTAL TESTIMONIALS IN DB:', testimonials.length);
}

inspect()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
