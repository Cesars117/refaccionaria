import db from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { Package, Users, FileText, Wrench, AlertTriangle, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReportesPage() {
  const [
    partCount,
    customerCount,
    quotes,
    projects,
    lowStockParts,
  ] = await Promise.all([
    db.part.count(),
    db.customer.count(),
    db.quote.findMany({ select: { status: true, total: true } }),
    db.maintenanceProject.groupBy({ by: ['status'], _count: { id: true } }),
    db.part.findMany({
      where: { quantity: { lte: db.part.fields.minStock } },
      orderBy: { quantity: 'asc' },
      take: 10,
      include: { category: true, location: true },
    }).catch(() => [] as any[]),
  ]);

  const totalRevenue = quotes.filter((q) => q.status === 'SOLD').reduce((s, q) => s + q.total, 0);
  const pendingRevenue = quotes.filter((q) => q.status === 'PENDING').reduce((s, q) => s + q.total, 0);
  const soldCount = quotes.filter((q) => q.status === 'SOLD').length;
  const pendingCount = quotes.filter((q) => q.status === 'PENDING').length;
  const projectsByStatus: Record<string, number> = {};
  projects.forEach((p) => { projectsByStatus[p.status] = p._count.id; });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-500">Visión general del negocio</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Ingresos (ventas)', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-green-600' },
          { label: 'Cotizaciones pendientes', value: formatCurrency(pendingRevenue), icon: FileText, color: 'text-amber-600' },
          { label: 'Partes en catálogo', value: partCount, icon: Package, color: 'text-blue-600' },
          { label: 'Clientes', value: customerCount, icon: Users, color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Cotizaciones
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Vendidas',   count: soldCount,    value: totalRevenue,   cls: 'bg-green-100 text-green-700' },
              { label: 'Pendientes', count: pendingCount, value: pendingRevenue, cls: 'bg-amber-100 text-amber-700' },
              { label: 'Canceladas', count: quotes.filter((q) => q.status === 'CANCELLED').length, value: null, cls: 'bg-red-100 text-red-700' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-lg p-3 bg-gray-50">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${row.cls}`}>{row.label}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">{row.count} cot.</span>
                  {row.value !== null && <span className="ml-3 text-sm text-gray-500">{formatCurrency(row.value)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="h-4 w-4" /> Proyectos de Mantenimiento
          </h2>
          <div className="space-y-3">
            {[
              { key: 'OPEN',          label: 'Abiertos',    cls: 'bg-blue-100 text-blue-700' },
              { key: 'IN_PROGRESS',   label: 'En proceso',  cls: 'bg-amber-100 text-amber-700' },
              { key: 'WAITING_PARTS', label: 'Esp. partes', cls: 'bg-orange-100 text-orange-700' },
              { key: 'COMPLETED',     label: 'Completados', cls: 'bg-green-100 text-green-700' },
              { key: 'CANCELLED',     label: 'Cancelados',  cls: 'bg-red-100 text-red-700' },
            ].map((row) => (
              <div key={row.key} className="flex items-center justify-between rounded-lg p-3 bg-gray-50">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${row.cls}`}>{row.label}</span>
                <span className="text-sm font-semibold text-gray-900">{projectsByStatus[row.key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="card-header flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-900">Partes con stock bajo</h2>
          </div>
          {lowStockParts.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">Sin alertas de stock</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header px-4 py-2">Parte</th>
                  <th className="table-header px-3 py-2">Categoría</th>
                  <th className="table-header px-3 py-2">Ubicación</th>
                  <th className="table-header px-3 py-2 text-right">Stock</th>
                  <th className="table-header px-3 py-2 text-right">Mínimo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(lowStockParts as any[]).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{p.category?.name ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{p.location?.name ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-sm font-semibold text-red-600">{p.quantity}</td>
                    <td className="px-3 py-2 text-right text-sm text-gray-500">{p.minStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

