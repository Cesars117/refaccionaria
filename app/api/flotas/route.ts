import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const fleets = await db.fleet.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      _count: { select: { units: true, projects: true } },
    },
  });

  return NextResponse.json(fleets);
}
