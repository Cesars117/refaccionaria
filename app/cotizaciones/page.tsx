import { getQuotes } from '@/app/actions';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import QuoteRowActions from './QuoteRowActions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canViewRevenue } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, { label: string; class: string }> = {
  PENDING:   { label: 'Pendiente', class: 'bg-amber-100 text-amber-700' },
  SOLD:      { label: 'Vendida',   class: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelada', class: 'bg-red-100 text-red-700' },
};

export default async function CotizacionesPage() {
  const session = await getServerSession(authOptions);
  const allowRevenue = canViewRevenue(session?.user?.role);
  const quotes = await getQuotes();

  const pending = quotes.filter((q) => q.status === 'PENDING').length;
  const sold    = quotes.filter((q) => q.status === 'SOLD').length;
  const totalSold = quotes.filter((q) => q.status === 'SOLD').reduce((s, q) => s + q.total, 0);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-sm text-gray-500">{quotes.length} cotizaciones</p>
        </div>
        <Link href="/cotizaciones/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" /> Nueva cotización
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{pending}</p>
          <p className="text-xs text-gray-500">Pendientes</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{sold}</p>
          <p className="text-xs text-gray-500">Vendidas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-lg font-bold text-gray-900">{allowRevenue ? formatCurrency(totalSold) : 'Oculto'}</p>
          <p className="text-xs text-gray-500">Total vendido</p>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="card py-12 text-center text-sm text-gray-400">
          Sin cotizaciones. <Link href="/cotizaciones/nuevo" className="text-brand-600">Crear primera.</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header px-6 py-3">Cotización</th>
                  <th className="table-header px-4 py-3">Cliente</th>
                  <th className="table-header px-4 py-3">Vehículo</th>
                  <th className="table-header px-4 py-3">Partidas</th>
                  <th className="table-header px-4 py-3 text-right">Total</th>
                  <th className="table-header px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {quotes.map((q) => {
                  let sc = { label: q.status, class: 'bg-gray-100 text-gray-600' };
                  if (q.status === 'PENDING') {
                    sc = { label: 'Pendiente', class: 'bg-amber-100 text-amber-700' };
                  } else if (q.status === 'CANCELLED') {
                    sc = { label: 'Cancelada', class: 'bg-red-100 text-red-700' };
                  } else if (q.status === 'SOLD') {
                    switch (q.fulfillmentStatus) {
                      case 'PENDING_STOCK_CHECK':
                        sc = { label: 'Vendida (Verificar Stock)', class: 'bg-yellow-100 text-yellow-800 border border-yellow-200' };
                        break;
                      case 'AWAITING_STOCK':
                        if (q.supplierStatus === 'ORDERED') {
                          sc = { label: 'Vendida (Prov. Solicitado)', class: 'bg-orange-100 text-orange-800 border border-orange-200' };
                        } else {
                          sc = { label: 'Vendida (Espera Proveedor)', class: 'bg-orange-150 text-orange-850 border border-orange-300 font-semibold' };
                        }
                        break;
                      case 'PENDING_PICKUP':
                        sc = { label: 'Vendida (Listo p/ Recoger)', class: 'bg-blue-100 text-blue-800 border border-blue-200' };
                        break;
                      case 'PENDING_DELIVERY':
                        sc = { label: 'Vendida (Pendiente Entrega)', class: 'bg-indigo-100 text-indigo-800 border border-indigo-200' };
                        break;
                      case 'COMPLETED':
                        sc = { label: 'Vendida (Entregado)', class: 'bg-green-100 text-green-700 border border-green-200' };
                        break;
                      default:
                        sc = { label: 'Vendida', class: 'bg-green-100 text-green-700' };
                    }
                  }
                  return (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-gray-900">{q.quoteNumber}</p>
                        <p className="text-xs text-gray-400">{new Date(q.createdAt).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{q.customer.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{q.vehicleRef ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{q._count.items}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{allowRevenue ? formatCurrency(q.total) : 'Oculto'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.class}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <QuoteRowActions quoteId={q.id} status={q.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
