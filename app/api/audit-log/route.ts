import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'

// GET /api/audit-log — list audit logs with filters
export async function GET(request: NextRequest) {
  // Session check disabled
  const session = { user: { email: 'admin' } };


  const sp = request.nextUrl.searchParams
  const entityType = sp.get('entityType')
  const action = sp.get('action')
  const userId = sp.get('userId')
  const from = sp.get('from')
  const to = sp.get('to')
  const page = parseInt(sp.get('page') || '1')
  const limit = Math.min(parseInt(sp.get('limit') || '50'), 200)

  const where: Record<string, unknown> = {}
  if (entityType) where.entityType = entityType
  if (action) where.action = action
  if (userId) where.userId = userId
  if (from || to) {
    where.createdAt = {}
    if (from) (where.createdAt as Record<string, Date>).gte = new Date(from)
    if (to) (where.createdAt as Record<string, Date>).lte = new Date(to)
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, limit })
}
