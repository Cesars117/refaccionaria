import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

// PUT /api/site-kits/[id]/items/[itemId] — update a site kit item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, itemId } = await params
  const siteKitId = parseInt(id)
  const siteKitItemId = parseInt(itemId)
  if (isNaN(siteKitId) || isNaN(siteKitItemId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  try {
    const body = await request.json()

    const updated = await db.$transaction(async (tx) => {
      const existing = await tx.siteKitItem.findFirst({
        where: { id: siteKitItemId, siteKitId },
      })
      if (!existing) throw new Error('Item not found')

      const item = await tx.siteKitItem.update({
        where: { id: siteKitItemId },
        data: {
          siteKitSku: body.siteKitSku ?? existing.siteKitSku,
          description: body.description ?? existing.description,
          quantityExpected: body.quantityExpected !== undefined
            ? parseInt(body.quantityExpected)
            : existing.quantityExpected,
          notes: body.notes !== undefined ? body.notes : existing.notes,
        },
      })

      await createAuditLog(tx, session, {
        action: 'UPDATED',
        entityType: 'SITE_KIT_ITEM',
        entityId: item.id,
        entityLabel: `SKU ${item.siteKitSku} - ${item.description}`,
      })

      return item
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating site kit item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

// DELETE /api/site-kits/[id]/items/[itemId] — delete a site kit item
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, itemId } = await params
  const siteKitId = parseInt(id)
  const siteKitItemId = parseInt(itemId)
  if (isNaN(siteKitId) || isNaN(siteKitItemId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  try {
    await db.$transaction(async (tx) => {
      const existing = await tx.siteKitItem.findFirst({
        where: { id: siteKitItemId, siteKitId },
      })
      if (!existing) throw new Error('Item not found')

      // Delete associated asset tags first
      await tx.siteKitAssetTag.deleteMany({
        where: { siteKitItemId },
      })

      await tx.siteKitItem.delete({
        where: { id: siteKitItemId },
      })

      await createAuditLog(tx, session, {
        action: 'DELETED',
        entityType: 'SITE_KIT_ITEM',
        entityId: siteKitItemId,
        entityLabel: `SKU ${existing.siteKitSku} - ${existing.description}`,
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting site kit item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
