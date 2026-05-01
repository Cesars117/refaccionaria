'use server'

import db from '@/lib/db';

const TIENDA_WEBHOOK_URL = process.env.TIENDA_WEBHOOK_URL || 'https://radiamex.com/api/webhooks/inventory-sync';
const TIENDA_API_KEY = process.env.TIENDA_API_KEY || 'radiamex_secret_sync_2024';

export async function notifyTiendaOfUpdate(partId: number) {
  try {
    const part = await db.part.findUnique({
      where: { id: partId },
      include: { category: true }
    });

    if (!part) return;

    console.log(`Notificando a la tienda sobre actualización de parte ${partId}`);
    
    // En un escenario real, aquí haríamos el fetch a la tienda
    /*
    await fetch(TIENDA_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': TIENDA_API_KEY
      },
      body: JSON.stringify({
        action: 'UPDATE_STOCK',
        part: {
          sku: part.sku,
          quantity: part.quantity,
          price: part.price,
          name: part.name
        }
      })
    });
    */
  } catch (error) {
    console.error('Error al notificar a la tienda:', error);
  }
}

export async function importFromTienda(jsonParts: any[]) {
  let count = 0;
  for (const item of jsonParts) {
    try {
      // Buscar si ya existe por SKU
      const existing = item.sku ? await db.part.findUnique({ where: { sku: item.sku } }) : null;
      
      if (existing) {
        await db.part.update({
          where: { id: existing.id },
          data: {
            quantity: item.quantity ?? existing.quantity,
            price: item.price ?? existing.price,
          }
        });
      } else {
        await db.part.create({
          data: {
            name: item.name || 'Sin nombre',
            sku: item.sku || null,
            quantity: item.quantity || 0,
            price: item.price || 0,
            categoryId: 1, // Por defecto
            locationId: 1, // Por defecto
          }
        });
      }
      count++;
    } catch (e) {
      console.error(`Error importando item ${item.sku}:`, e);
    }
  }
  return count;
}
