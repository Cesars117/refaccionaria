import { PrismaClient } from '@prisma/client';

// Configuración de las dos bases de datos
const localPrisma = new PrismaClient(); // Usa la DATABASE_URL del .env local (Frenos)

// Base de datos de la tienda (Supabase)
const tiendaPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.sxwejjsmjolevddfqhru:Radiamex2026!@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

async function syncInventory() {
  console.log("🚀 Iniciando sincronización de inventario hacia Radiamex.com...");
  
  try {
    // 1. Obtener partes de Frenos
    const parts = await localPrisma.part.findMany({
      include: {
        category: true,
        fitment: {
          include: {
            vehicleModel: true
          }
        }
      }
    });

    console.log(`📦 Encontradas ${parts.length} partes en el sistema local.`);

    let updatedCount = 0;
    let createdCount = 0;

    for (const part of parts) {
      if (!part.sku) continue; // Necesitamos SKU para identificar en la tienda

      // 2. Mapear Part (Frenos) a Product (Tienda)
      const productData = {
        name: part.name,
        sku: part.sku,
        description: part.description || '',
        price: part.price,
        stock: part.quantity,
        internalStock: part.quantity,
        category: part.category?.name || 'Refacciones',
        brand: part.brand || 'Genérico',
        oemNumber: part.oemNumber || null,
        isActive: true,
      };

      // 3. Upsert en la base de datos de la tienda
      const existingProduct = await tiendaPrisma.$queryRaw`SELECT id FROM "Product" WHERE sku = ${part.sku} LIMIT 1`;
      
      let productId;
      
      if (Array.isArray(existingProduct) && existingProduct.length > 0) {
        // Actualizar
        const prod = existingProduct[0];
        await tiendaPrisma.$executeRaw`
          UPDATE "Product" 
          SET name = ${productData.name}, 
              description = ${productData.description}, 
              price = ${productData.price}, 
              stock = ${productData.stock}, 
              "internalStock" = ${productData.internalStock},
              category = ${productData.category},
              brand = ${productData.brand},
              "oemNumber" = ${productData.oemNumber},
              "updatedAt" = NOW()
          WHERE id = ${prod.id}
        `;
        productId = prod.id;
        updatedCount++;
      } else {
        // Crear (Usando queryRaw porque no tenemos el modelo Product cargado en este Prisma local)
        // Pero espera, si no tenemos el modelo, es mejor usar executeRaw
        const newId = `prod_${Math.random().toString(36).substr(2, 9)}`;
        await tiendaPrisma.$executeRaw`
          INSERT INTO "Product" (id, name, sku, description, price, stock, "internalStock", category, brand, "oemNumber", "isActive", "createdAt", "updatedAt")
          VALUES (${newId}, ${productData.name}, ${productData.sku}, ${productData.description}, ${productData.price}, ${productData.stock}, ${productData.internalStock}, ${productData.category}, ${productData.brand}, ${productData.oemNumber}, true, NOW(), NOW())
        `;
        productId = newId;
        createdCount++;
      }

      // 4. Sincronizar compatibilidad (opcional, pero recomendado)
      // Para este MVP solo sincronizamos la info básica del producto para el buscador.
    }

    console.log(`✅ Sincronización completada.`);
    console.log(`   - Productos actualizados: ${updatedCount}`);
    console.log(`   - Productos creados: ${createdCount}`);

  } catch (error) {
    console.error("❌ Error durante la sincronización:", error);
  } finally {
    await localPrisma.$disconnect();
    await tiendaPrisma.$disconnect();
  }
}

syncInventory();
