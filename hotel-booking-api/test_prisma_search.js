const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const hotels = await prisma.hotel.findMany({ 
    where: { city: { contains: "kiên giang", mode: "insensitive" } },
    select: { name: true, city: true } 
  });
  console.log("Matching 'kiên giang':", hotels);
}
main().catch(console.error).finally(() => prisma.$disconnect());
