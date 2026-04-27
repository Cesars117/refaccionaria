import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

// POST /api/site-kits/[id]/items — add items to existing site kit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const siteKitDbId = parseInt(id)
  if (isNaN(siteKitDbId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  try {
    const { items } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array required' }, { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      const siteKit = await tx.siteKit.findUnique({ where: { id: siteKitDbId } })
      if (!siteKit) throw new Error('Site Kit not found')

      const createdItems = []
      for (const item of items) {
        const skItem = await tx.siteKitItem.create({
          data: {
            siteKitId: siteKitDbId,
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

        createdItems.push(skItem)
      }

      return createdItems
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error adding items:', error)
    return NextResponse.json({ error: 'Failed to add items' }, { status: 500 })
  }
}
