import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import db from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { canViewAudit } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export default async function AuditoriaPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role

  if (!canViewAudit(role)) {
    redirect('/')
  }

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
        <p className="text-sm text-gray-500">Historial de acciones clave: inventario, cotizaciones y usuarios.</p>
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
