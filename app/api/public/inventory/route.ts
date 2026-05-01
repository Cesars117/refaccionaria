import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// Este endpoint permite a la tienda Radiamex obtener el inventario actualizado
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  const masterKey = process.env.TIENDA_API_KEY || 'radiamex_secret_sync_2024';

  if (apiKey !== masterKey) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const parts = await db.part.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        brand: true,
        oemNumber: true,
        price: true,
        priceFleet: true,
        quantity: true,
        description: true,
        category: { select: { name: true } },
        location: { select: { name: true } },
      },
      where: {
        isActive: true,
      }
    });

    return NextResponse.json({
      lastUpdate: new Date().toISOString(),
      count: parts.length,
      parts
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
