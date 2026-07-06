const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const hotels = await prisma.hotel.findMany({ 
    where: { city: { contains: "Đà Nẵng", mode: "insensitive" } },
    select: { name: true, city: true } 
  });
  console.log("Matching 'Đà Nẵng':", hotels);
}
main().catch(console.error).finally(() => prisma.$disconnect());
