import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';

  // 1. Buscar en la tabla local Part
  const parts = await db.part.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { sku: { contains: q } },
            { oemNumber: { contains: q } },
            { brand: { contains: q } },
          ],
        }
      : {},
    select: {
      id: true,
      name: true,
      sku: true,
      brand: true,
      oemNumber: true,
      price: true,
      priceFleet: true,
      quantity: true,
      minStock: true,
      category: { select: { name: true } },
      location: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
    take: 20,
  });

  // 2. Buscar en la tabla ShopProduct de la tienda
  let shopProducts: any[] = [];
  if (q && q.length >= 2) {
    try {
      const likeQuery = `%${q}%`;
      const rawShopProducts = await db.$queryRawUnsafe<any[]>(
        `SELECT id, name, sku, brand, oemNumber, price, stock AS quantity 
         FROM ShopProduct 
         WHERE name LIKE ? OR sku LIKE ? OR oemNumber LIKE ? OR brand LIKE ? 
         LIMIT 20`,
        likeQuery, likeQuery, likeQuery, likeQuery
      );

      // Mapear al mismo formato
      shopProducts = rawShopProducts.map((p) => ({
        id: `shop_${p.id}`,
        name: p.name,
        sku: p.sku || null,
        brand: p.brand || null,
        oemNumber: p.oemNumber || null,
        price: p.price || 0,
        priceFleet: null,
        quantity: 0, // En el catálogo se ofrece pero no está físicamente en existencias local
        minStock: 0,
        category: { name: 'Catálogo Tienda' },
        location: { name: 'Proveedor (Catálogo)' },
        isShopCatalog: true
      }));
    } catch (err) {
      console.error('Failed to query ShopProduct:', err);
    }
  }

  // 3. Eliminar duplicados (si ya existe en inventario local por SKU o nombre, preferir el local)
  const localSkus = new Set(parts.map((p) => p.sku?.toLowerCase()).filter(Boolean));
  const localNames = new Set(parts.map((p) => p.name.toLowerCase()));

  const filteredShopProducts = shopProducts.filter((sp) => {
    if (sp.sku && localSkus.has(sp.sku.toLowerCase())) return false;
    if (localNames.has(sp.name.toLowerCase())) return false;
    return true;
  });

  const combined = [...parts, ...filteredShopProducts];

  return NextResponse.json(combined);
}

