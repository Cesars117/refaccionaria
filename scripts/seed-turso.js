import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log("Debug: TURSO_DATABASE_URL is", url ? "defined" : "undefined");
console.log("Debug: DATABASE_URL is", process.env.DATABASE_URL);

if (!url) {
    throw new Error("TURSO_DATABASE_URL is missing");
}

const adapter = new PrismaLibSql({ url, authToken });
const db = new PrismaClient({ adapter });





async function seed() {
  try {
    console.log("Sembrando datos iniciales en Turso...");

    // 1. Categories
    const categories = ['Frenos', 'Discos', 'Radiadores', 'General'];
    for (const cat of categories) {
      await db.category.upsert({
        where: { name: cat },
        update: {},
        create: { name: cat }
      });
    }

    // 2. Locations
    const locations = ['Bodega Principal', 'Mostrador'];
    for (const loc of locations) {
      await db.location.upsert({
        where: { name: loc },
        update: {},
        create: { name: loc }
      });
    }

    // 3. Client Coyote
    const coyote = await db.client.upsert({
      where: { name: 'Coyote' },
      update: {},
      create: { 
        name: 'Coyote', 
        phone: '555-0101', 
        address: 'Av. Industrial 123' 
      }
    });

    // 4. Vehicle Nissan 300
    await db.vehicle.upsert({
      where: { plate: 'COY-001' },
      update: {},
      create: {
        model: 'Nissan 300',
        plate: 'COY-001',
        clientId: coyote.id
      }
    });

    console.log("¡Semilla completada con éxito en la nube!");
  } catch (error) {
    console.error("Error sembrando datos:", error);
  } finally {
    process.exit(0);
  }
}

seed();
