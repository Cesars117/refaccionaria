import { PrismaClient } from '@prisma/client'
import { Session } from 'next-auth'

interface AuditLogParams {
  action: string
  entityType: string
  entityId: string
  details?: string
}

type PrismaTransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export async function createAuditLog(
  prisma: PrismaTransactionClient,
  session: Session | null,
  params: AuditLogParams
) {
  const userEmail = session?.user?.email || 'system@local'
  const userName = session?.user?.name || null

  await prisma.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      userEmail,
      userName,
      details: params.details || null,
    },
  })
}
