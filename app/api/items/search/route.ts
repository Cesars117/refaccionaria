import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'

// GET /api/items/search?sku=XXXXX — search WIP items by siteKitSku
// GET /api/items/search?q=TEXT — search WIP items by name/description (fuzzy)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sku = request.nextUrl.searchParams.get('sku')
  const q = request.nextUrl.searchParams.get('q')

  if (!sku && !q) {
    return NextResponse.json({ error: 'sku or q parameter required' }, { status: 400 })
  }

  if (sku) {
    const items = await db.item.findMany({
      where: { siteKitSku: sku },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        quantity: true,
        status: true,
        sku: true,
        siteKitSku: true,
        createdAt: true,
        location: { select: { name: true } },
        serialNumbers: { select: { id: true, serialNumber: true, tmoSerial: true } },
      },
    })
    return NextResponse.json(items)
  }

  // Search by description keywords
  const keywords = q!.trim().split(/\s+/).filter(k => k.length >= 2)
  if (keywords.length === 0) {
    return NextResponse.json([])
  }

  const items = await db.item.findMany({
    where: {
      AND: keywords.map(kw => ({
        name: { contains: kw },
      })),
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      name: true,
      quantity: true,
      status: true,
      sku: true,
      siteKitSku: true,
      createdAt: true,
      location: { select: { name: true } },
      serialNumbers: { select: { id: true, serialNumber: true, tmoSerial: true } },
    },
  })

  return NextResponse.json(items)
}
