import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';

  const parts = await db.part.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
            { oemNumber: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
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
      category: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
    take: 20,
  });

  return NextResponse.json(parts);
}
