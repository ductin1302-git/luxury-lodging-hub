const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Dropping unused tables...');
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "audit_logs" CASCADE;`);
    console.log('Dropped audit_logs');
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "room_inventory" CASCADE;`);
    console.log('Dropped room_inventory');
    console.log('Unused tables dropped successfully.');
  } catch (e) {
    console.error('Error dropping tables:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
