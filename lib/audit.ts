import { PrismaClient } from '@prisma/client'
import { Session } from 'next-auth'

type AuditAction = 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED' | 'QTY_CHANGED' | 'VERIFIED' | 'LINKED'
type AuditEntityType = 'ITEM' | 'SERIAL_NUMBER' | 'SITE_KIT' | 'SITE_KIT_ITEM' | 'ASSET_TAG'

interface AuditLogParams {
  action: AuditAction
  entityType: AuditEntityType
  entityId: number
  entityLabel?: string
  fieldChanged?: string
  oldValue?: string
  newValue?: string
  metadata?: Record<string, unknown>
}

type PrismaTransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export async function createAuditLog(
  prisma: PrismaTransactionClient,
  session: Session | null,
  params: AuditLogParams
) {
  const userId = session?.user?.email || 'system'
  const userEmail = session?.user?.email || null
  const userName = session?.user?.name || null

  await prisma.auditLog.create({
    data: {
      userId,
      userEmail,
      userName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityLabel: params.entityLabel || null,
      fieldChanged: params.fieldChanged || null,
      oldValue: params.oldValue || null,
      newValue: params.newValue || null,
      // SQLite does not support Json natively — serialize as string
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  })
}
