const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Starting custom migration...');
  
  // 1. Alter users table
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN latitude DOUBLE NULL`);
    console.log('Added users.latitude');
  } catch (e) {
    console.log('users.latitude might already exist:', e.message);
  }
  
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN longitude DOUBLE NULL`);
    console.log('Added users.longitude');
  } catch (e) {
    console.log('users.longitude might already exist:', e.message);
  }

  // 2. Alter quotes table
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE quotes ADD COLUMN deliveryType VARCHAR(191) NOT NULL DEFAULT 'WILL_CALL'`);
    console.log('Added quotes.deliveryType');
  } catch (e) {
    console.log('quotes.deliveryType might already exist:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE quotes ADD COLUMN fulfillmentStatus VARCHAR(191) NOT NULL DEFAULT 'PENDING_STOCK_CHECK'`);
    console.log('Added quotes.fulfillmentStatus');
  } catch (e) {
    console.log('quotes.fulfillmentStatus might already exist:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE quotes ADD COLUMN supplierStatus VARCHAR(191) NOT NULL DEFAULT 'NONE'`);
    console.log('Added quotes.supplierStatus');
  } catch (e) {
    console.log('quotes.supplierStatus might already exist:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE quotes ADD COLUMN deliveryAddress TEXT NULL`);
    console.log('Added quotes.deliveryAddress');
  } catch (e) {
    console.log('quotes.deliveryAddress might already exist:', e.message);
  }

  // 3. Create delivery_routes
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS delivery_routes (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        driverId VARCHAR(191) NULL,
        status VARCHAR(191) NOT NULL DEFAULT 'PENDING',
        startAddress VARCHAR(191) NOT NULL DEFAULT 'Av. Norte y Coahuila #58, Dolores Hidalgo, GTO (Nuestra Sucursal)',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL,
        CONSTRAINT fk_driver FOREIGN KEY (driverId) REFERENCES users(id) ON DELETE SET NULL
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('Created delivery_routes table');
  } catch (e) {
    console.log('Error creating delivery_routes:', e.message);
  }

  // 3b. Alter delivery_routes if already exists but column is missing
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE delivery_routes ADD COLUMN startAddress VARCHAR(191) NOT NULL DEFAULT 'Av. Norte y Coahuila #58, Dolores Hidalgo, GTO (Nuestra Sucursal)'`);
    console.log('Added delivery_routes.startAddress column');
  } catch (e) {
    console.log('delivery_routes.startAddress might already exist:', e.message);
  }

  // 4. Create delivery_stops
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS delivery_stops (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        routeId VARCHAR(191) NOT NULL,
        sequence INT NOT NULL,
        type VARCHAR(191) NOT NULL,
        quoteId VARCHAR(191) NULL,
        address VARCHAR(191) NOT NULL,
        latitude DOUBLE NULL,
        longitude DOUBLE NULL,
        contactName VARCHAR(191) NOT NULL,
        contactPhone VARCHAR(191) NOT NULL,
        details TEXT NOT NULL,
        paymentStatus VARCHAR(191) NOT NULL,
        amountToCollect DOUBLE NOT NULL DEFAULT 0,
        status VARCHAR(191) NOT NULL DEFAULT 'PENDING',
        failedReason VARCHAR(191) NULL,
        eta DATETIME(3) NULL,
        completedAt DATETIME(3) NULL,
        CONSTRAINT fk_route FOREIGN KEY (routeId) REFERENCES delivery_routes(id) ON DELETE CASCADE,
        CONSTRAINT fk_quote FOREIGN KEY (quoteId) REFERENCES quotes(id) ON DELETE SET NULL
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('Created delivery_stops table');
  } catch (e) {
    console.log('Error creating delivery_stops:', e.message);
  }

  // 4b. Alter delivery_stops if already exists but paymentMethod is missing
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE delivery_stops ADD COLUMN paymentMethod VARCHAR(191) NULL`);
    console.log('Added delivery_stops.paymentMethod column');
  } catch (e) {
    console.log('delivery_stops.paymentMethod might already exist:', e.message);
  }

  console.log('Custom migration finished.');
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
