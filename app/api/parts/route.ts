import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';

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

  return NextResponse.json(parts);
}
