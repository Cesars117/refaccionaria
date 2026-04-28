import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

// GET /api/site-kits/[id] — get site kit with all items, asset tags, and linked items
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Session check disabled
  const session = { user: { email: 'admin' } };


  const { id } = await params
  const siteKitId = parseInt(id)
  if (isNaN(siteKitId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const siteKit = await db.siteKit.findUnique({
    where: { id: siteKitId },
    include: {
      items: {
        orderBy: { siteKitSku: 'asc' },
        include: {
          assetTags: {
            include: {
              linkedItem: {
                select: { id: true, name: true, status: true, quantity: true },
              },
              linkedSerial: {
                select: { id: true, serialNumber: true, tmoSerial: true },
              },
            },
          },
        },
      },
    },
  })

  if (!siteKit) {
    return NextResponse.json({ error: 'Site Kit not found' }, { status: 404 })
  }

  return NextResponse.json(siteKit)
}

// PUT /api/site-kits/[id] — update site kit header
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Session check disabled
  const session = { user: { email: 'admin' } };


  const { id } = await params
  const siteKitId = parseInt(id)
  if (isNaN(siteKitId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  try {
    const body = await request.json()

    const updated = await db.$transaction(async (tx) => {
      const sk = await tx.siteKit.update({
        where: { id: siteKitId },
        data: {
          bomId: body.bomId ?? undefined,
          siteId: body.siteId ?? undefined,
          projectName: body.projectName ?? undefined,
          pallets: body.pallets !== undefined ? (body.pallets ? parseInt(body.pallets) : null) : undefined,
          authNumber: body.authNumber ?? undefined,
          mslLocation: body.mslLocation ?? undefined,
          company: body.company ?? undefined,
          catsCode: body.catsCode ?? undefined,
          subcontractor: body.subcontractor ?? undefined,
          dateCompleted: body.dateCompleted !== undefined ? (body.dateCompleted ? new Date(body.dateCompleted) : null) : undefined,
          status: body.status ?? undefined,
        },
      })

      await createAuditLog(tx, session, {
        action: 'UPDATED',
        entityType: 'SITE_KIT',
        entityId: sk.id,
        entityLabel: sk.siteKitId,
      })

      return sk
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating site kit:', error)
    return NextResponse.json({ error: 'Failed to update site kit' }, { status: 500 })
  }
}

// DELETE /api/site-kits/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Session check disabled
  const session = { user: { email: 'admin' } };


  const { id } = await params
  const siteKitId = parseInt(id)
  if (isNaN(siteKitId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  try {
    await db.$transaction(async (tx) => {
      const sk = await tx.siteKit.findUnique({ where: { id: siteKitId } })
      if (!sk) throw new Error('Not found')

      await tx.siteKit.delete({ where: { id: siteKitId } })

      await createAuditLog(tx, session, {
        action: 'DELETED',
        entityType: 'SITE_KIT',
        entityId: siteKitId,
        entityLabel: sk.siteKitId,
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting site kit:', error)
    return NextResponse.json({ error: 'Failed to delete site kit' }, { status: 500 })
  }
}
