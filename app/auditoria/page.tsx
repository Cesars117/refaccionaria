import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import db from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { canViewAudit } from '@/lib/rbac'
import AuditFilter from './AuditFilter'

export const dynamic = 'force-dynamic'

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: { type?: string }
}) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const selectedType = (await searchParams).type // Handle async searchParams if needed in Next 15+ but current is 16? Actually Next 16 might have it as Promise.

  // Wait, let's check Next version. 16.1.1.
  // In Next 15+, searchParams is a Promise.

  if (!canViewAudit(role)) {
    redirect('/')
  }

  // ... (rest of the code)

  let logs: Array<{
    id: number
    action: string
    entityType: string
    entityId: string
    userEmail: string
    userName?: string | null
    details?: string | null
    createdAt: Date
  }> = []

  try {
    logs = await db.auditLog.findMany({
      where: selectedType ? { entityType: selectedType } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
  } catch {
    // Fallback for raw SQL
    const filter = selectedType ? `WHERE entityType = '${selectedType}'` : ''
    const rows = (await db.$queryRawUnsafe(`
      SELECT id, action, entityType, entityId, userEmail, details, createdAt
      FROM audit_log
      ${filter}
      ORDER BY createdAt DESC
      LIMIT 200
    `)) as Array<any>

    logs = rows.map((row) => ({
      ...row,
      userName: null,
      createdAt: new Date(row.createdAt),
    }))
  }

  const filterOptions = [
    { label: 'Todos', value: '' },
    { label: 'Finanzas', value: 'FINANCIAL' },
    { label: 'Inventario / Partes', value: 'PART' },
    { label: 'Cat. / Ubicaciones', value: 'INVENTORY' },
    { label: 'Clientes', value: 'CUSTOMER' },
    { label: 'Flotas / Unidades', value: 'FLEET' },
    { label: 'Proyectos', value: 'PROJECT' },
    { label: 'Cotizaciones', value: 'QUOTE' },
    { label: 'Usuarios', value: 'USER' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
          <p className="text-sm text-gray-500">Historial completo de cambios en la base de datos.</p>
        </div>

        <AuditFilter initialType={selectedType || ''} options={filterOptions} />
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header px-4 py-3">Fecha</th>
              <th className="table-header px-4 py-3">Usuario</th>
              <th className="table-header px-4 py-3">Acción</th>
              <th className="table-header px-4 py-3">Entidad</th>
              <th className="table-header px-4 py-3">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {logs.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-gray-400" colSpan={5}>Sin registros de auditoría</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString('es-MX')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <p className="font-medium text-gray-900">{log.userName ?? 'Sistema'}</p>
                    <p className="text-xs text-gray-500">{log.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-brand-700">{log.action}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{log.entityType} #{log.entityId}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{log.details ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
