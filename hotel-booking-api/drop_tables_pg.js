const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:123456@localhost:5432/hotel_booking?schema=public'
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    await client.query('DROP TABLE IF EXISTS "audit_logs" CASCADE;');
    console.log('Dropped audit_logs');

    await client.query('DROP TABLE IF EXISTS "room_inventory" CASCADE;');
    console.log('Dropped room_inventory');

    console.log('Unused tables dropped successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
