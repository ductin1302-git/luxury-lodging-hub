const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const hotels = await prisma.hotel.findMany({ select: { id: true, name: true, city: true, isActive: true, status: true, rooms: true } });
  console.log(JSON.stringify(hotels, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
