import db from '@/lib/db';
import Link from 'next/link';
import { Package, Users, Car, FileText, AlertTriangle, DollarSign, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const [
    partCount,
    customerCount,
    vehicleCount,
    quotes,
    lowStockParts,
    recentQuotes,
  ] = await Promise.all([
    db.part.count(),
    db.customer.count(),
    db.vehicleModel.count(),
    db.quote.findMany({ select: { status: true, total: true } }),
    db.part.findMany({
      where: { quantity: { lte: db.part.fields.minStock } },
      take: 5,
      orderBy: { quantity: 'asc' },
      include: { category: true },
    }).catch(() => []),
    db.quote.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    }),
  ]);

  const pendingQuotes = quotes.filter((q) => q.status === 'PENDING').length;
  const soldQuotes = quotes.filter((q) => q.status === 'SOLD').length;
  const totalRevenue = quotes
    .filter((q) => q.status === 'SOLD')
    .reduce((sum, q) => sum + q.total, 0);

  return { partCount, customerCount, vehicleCount, pendingQuotes, soldQuotes, totalRevenue, lowStockParts, recentQuotes };
}

export default async function Home() {
  const data = await getDashboardData();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Resumen general de A/C Radiamex</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        <StatCard title="Partes" value={data.partCount} icon={<Package className="h-6 w-6" />} color="blue" href="/partes" />
        <StatCard title="Clientes" value={data.customerCount} icon={<Users className="h-6 w-6" />} color="purple" href="/clientes" />
        <StatCard title="Vehículos" value={data.vehicleCount} icon={<Car className="h-6 w-6" />} color="indigo" href="/vehiculos" />
        <StatCard title="Cotizaciones Pendientes" value={data.pendingQuotes} icon={<FileText className="h-6 w-6" />} color="yellow" href="/cotizaciones?status=PENDING" />
        <StatCard title="Ventas Cerradas" value={data.soldQuotes} icon={<FileText className="h-6 w-6" />} color="green" href="/cotizaciones?status=SOLD" />
        <StatCard title="Ingresos" value={formatCurrency(data.totalRevenue)} icon={<DollarSign className="h-6 w-6" />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Cotizaciones Recientes</h2>
            <Link href="/cotizaciones" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recentQuotes.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">Sin cotizaciones aún</p>
            ) : (
              data.recentQuotes.map((q) => (
                <Link key={q.id} href={`/cotizaciones/${q.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{q.customer.name}</p>
                    {q.vehicleRef && (
                      <p className="text-xs text-gray-500">{q.vehicleRef}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(q.total)}</p>
                    <StatusPill status={q.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Stock Bajo
            </h2>
            <Link href="/partes?filter=low-stock" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {data.lowStockParts.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">Sin alertas de stock</p>
            ) : (
              data.lowStockParts.map((p) => (
                <Link key={p.id} href={`/partes/${p.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.category?.name} • SKU: {p.sku ?? '—'}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600">{p.quantity} uds.</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, href }: {
  title: string; value: number | string; icon: React.ReactNode;
  color: 'blue' | 'purple' | 'indigo' | 'yellow' | 'green' | 'emerald'; href?: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    yellow: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  const Wrapper = href ? Link : 'div';
  return (
    <Wrapper href={href as string} className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
      <div className={`inline-flex items-center justify-center rounded-lg p-2 mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>
    </Wrapper>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    SOLD: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    SOLD: 'Vendido',
    CANCELLED: 'Cancelado',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}

