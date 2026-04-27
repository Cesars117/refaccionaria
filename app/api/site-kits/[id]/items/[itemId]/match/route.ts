import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

// POST /api/site-kits/[id]/items/[itemId]/match — link WIP items to a SiteKitItem
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, itemId } = await params
  const siteKitDbId = parseInt(id)
  const siteKitItemId = parseInt(itemId)
  if (isNaN(siteKitDbId) || isNaN(siteKitItemId)) {
    return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
  }

  try {
    const { itemIds } = await request.json()
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds array required' }, { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      const skItem = await tx.siteKitItem.findUnique({
        where: { id: siteKitItemId },
        include: { assetTags: true },
      })
      if (!skItem || skItem.siteKitId !== siteKitDbId) {
        throw new Error('SiteKitItem not found')
      }

      // Link each WIP item and sum their quantities
      let totalQtyLinked = 0
      for (const wipItemId of itemIds) {
        const wipItem = await tx.item.findUnique({
          where: { id: parseInt(wipItemId) },
          include: { serialNumbers: true },
        })
        if (!wipItem) continue

        totalQtyLinked += wipItem.quantity

        // Find unlinked EXPECTED asset tags and link them
        const availableTags = skItem.assetTags.filter((t) => t.status === 'EXPECTED' && !t.linkedItemId)

        if (availableTags.length > 0) {
          const tagToLink = availableTags[0]
          await tx.siteKitAssetTag.update({
            where: { id: tagToLink.id },
            data: {
              linkedItemId: wipItem.id,
              linkedSerialId: wipItem.serialNumbers[0]?.id || null,
              status: 'RECEIVED',
              verifiedAt: new Date(),
              verifiedBy: session.user?.email || 'system',
            },
          })

          await createAuditLog(tx, session, {
            action: 'LINKED',
            entityType: 'ASSET_TAG',
            entityId: tagToLink.id,
            entityLabel: `${tagToLink.assetTag} → ${wipItem.name}`,
          })
        }

      }

      // Recalculate quantityReceived using actual quantities from WIP items
      const actualReceived = skItem.quantityReceived + totalQtyLinked

      // Determine new status
      let newStatus: string
      if (actualReceived === 0) newStatus = 'PENDING'
      else if (actualReceived >= skItem.quantityExpected) {
        newStatus = actualReceived > skItem.quantityExpected ? 'SURPLUS' : 'VERIFIED'
      } else {
        newStatus = 'PARTIAL'
      }

      const updatedItem = await tx.siteKitItem.update({
        where: { id: siteKitItemId },
        data: {
          quantityReceived: actualReceived,
          status: newStatus,
        },
      })

      await createAuditLog(tx, session, {
        action: 'VERIFIED',
        entityType: 'SITE_KIT_ITEM',
        entityId: siteKitItemId,
        entityLabel: `SKU ${skItem.siteKitSku}`,
        fieldChanged: 'quantityReceived',
        oldValue: String(skItem.quantityReceived),
        newValue: String(actualReceived),
      })

      // Recalculate SiteKit global status
      const allItems = await tx.siteKitItem.findMany({
        where: { siteKitId: siteKitDbId },
      })

      let siteKitStatus: string
      const allVerified = allItems.every((i) => i.status === 'VERIFIED')
      const anyMissing = allItems.some((i) => i.status === 'MISSING')
      const anyPendingOrPartial = allItems.some((i) => i.status === 'PENDING' || i.status === 'PARTIAL')

      if (allVerified) siteKitStatus = 'COMPLETE'
      else if (anyMissing) siteKitStatus = 'DISCREPANCY'
      else if (anyPendingOrPartial) siteKitStatus = 'IN_PROGRESS'
      else siteKitStatus = 'IN_PROGRESS'

      const updatedKit = await tx.siteKit.update({
        where: { id: siteKitDbId },
        data: { status: siteKitStatus },
      })

      return { siteKitItem: updatedItem, siteKit: updatedKit }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error matching items:', error)
    return NextResponse.json({ error: 'Failed to match items' }, { status: 500 })
  }
}
