const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.booking.count();
  console.log('TOTAL_BOOKINGS_IN_DB:', count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
