import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

// GET /api/site-kits — list all site kits
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const siteKits = await db.siteKit.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        select: {
          id: true,
          status: true,
          quantityExpected: true,
          quantityReceived: true,
        },
      },
    },
  })

  const result = siteKits.map((sk) => {
    const totalItems = sk.items.length
    const verified = sk.items.filter((i) => i.status === 'VERIFIED').length
    const totalExpected = sk.items.reduce((s, i) => s + i.quantityExpected, 0)
    const totalReceived = sk.items.reduce((s, i) => s + i.quantityReceived, 0)
    const matchPct = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0
    return {
      id: sk.id,
      siteKitId: sk.siteKitId,
      siteId: sk.siteId,
      projectName: sk.projectName,
      bomId: sk.bomId,
      status: sk.status,
      createdAt: sk.createdAt,
      totalItems,
      verified,
      matchPct,
    }
  })

  return NextResponse.json(result)
}

// POST /api/site-kits — create a new site kit (with items and asset tags)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const {
      siteKitId,
      bomId,
      siteId,
      projectName,
      pallets,
      authNumber,
      dateCompleted,
      mslLocation,
      company,
      catsCode,
      subcontractor,
      items,
    } = body

    if (!siteKitId || typeof siteKitId !== 'string') {
      return NextResponse.json({ error: 'siteKitId is required' }, { status: 400 })
    }

    const existing = await db.siteKit.findUnique({ where: { siteKitId } })
    if (existing) {
      return NextResponse.json({ error: 'Site Kit ID already exists' }, { status: 409 })
    }

    const result = await db.$transaction(async (tx) => {
      const siteKit = await tx.siteKit.create({
        data: {
          siteKitId,
          bomId: bomId || null,
          siteId: siteId || null,
          projectName: projectName || null,
          pallets: pallets ? parseInt(pallets) : null,
          authNumber: authNumber || null,
          mslLocation: mslLocation || null,
          company: company || null,
          catsCode: catsCode || null,
          subcontractor: subcontractor || null,
          dateCompleted: dateCompleted ? new Date(dateCompleted) : null,
        },
      })

      await createAuditLog(tx, session, {
        action: 'CREATED',
        entityType: 'SITE_KIT',
        entityId: siteKit.id,
        entityLabel: siteKitId,
      })

      // Create items & asset tags
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const skItem = await tx.siteKitItem.create({
            data: {
              siteKitId: siteKit.id,
              siteKitSku: String(item.siteKitSku),
              description: item.description || '',
              quantityExpected: parseInt(item.quantity) || 0,
              quantityReceived: 0,
              status: 'PENDING',
            },
          })

          await createAuditLog(tx, session, {
            action: 'CREATED',
            entityType: 'SITE_KIT_ITEM',
            entityId: skItem.id,
            entityLabel: `SKU ${item.siteKitSku} - ${item.description}`,
          })

          // Create asset tags if provided
          if (item.assetTags && Array.isArray(item.assetTags)) {
            for (const tag of item.assetTags) {
              if (typeof tag === 'string' && tag.trim()) {
                await tx.siteKitAssetTag.create({
                  data: {
                    siteKitItemId: skItem.id,
                    assetTag: tag.trim(),
                    status: 'EXPECTED',
                  },
                })
              }
            }
          }
        }
      }

      return siteKit
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating site kit:', error)
    return NextResponse.json({ error: 'Failed to create site kit' }, { status: 500 })
  }
}
