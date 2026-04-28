import { getCustomerById } from '@/app/actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Truck, Wrench, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import NuevaUnidadForm from './NuevaUnidadForm';

export const dynamic = 'force-dynamic';

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const isFleet = customer.type === 'FLEET';

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clientes" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isFleet ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {isFleet ? 'Flota' : 'Retail'}
              </span>
            </div>
            <p className="text-sm text-gray-500">{customer.phone}{customer.email ? ` · ${customer.email}` : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/cotizaciones/nuevo?customerId=${customer.id}`} className="btn-secondary">
            <FileText className="h-4 w-4" /> Nueva Cotización
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Datos del cliente</h2>
            <dl className="space-y-2 text-sm">
              {customer.address && (
                <div><dt className="text-gray-400">Dirección</dt><dd className="text-gray-900">{customer.address}</dd></div>
              )}
              {customer.rfc && (
                <div><dt className="text-gray-400">RFC</dt><dd className="text-gray-900">{customer.rfc}</dd></div>
              )}
              {customer.notes && (
                <div><dt className="text-gray-400">Notas</dt><dd className="text-gray-900">{customer.notes}</dd></div>
              )}
            </dl>
          </div>

          {/* Recent quotes */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Cotizaciones
              </h2>
              <Link href={`/cotizaciones/nuevo?customerId=${customer.id}`} className="text-xs text-brand-600">+ Nueva</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {customer.quotes.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-gray-400">Sin cotizaciones</p>
              ) : (
                customer.quotes.map((q) => (
                  <Link key={q.id} href={`/cotizaciones/${q.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
                    <p className="text-xs font-medium text-gray-900">{q.quoteNumber}</p>
                    <div className="text-right">
                      <p className="text-xs font-semibold">{formatCurrency(q.total)}</p>
                      <StatusPill status={q.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Fleet section */}
        {isFleet && customer.fleet && (
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-purple-600" /> {customer.fleet.name}
                </h2>
                <Link href={`/proyectos/nuevo?fleetId=${customer.fleet.id}`} className="btn-secondary text-xs py-1.5 px-3">
                  <Wrench className="h-3 w-3" /> Nuevo proyecto
                </Link>
              </div>

              {/* Units */}
              <div className="px-6 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">Unidades ({customer.fleet.units.length})</p>
                </div>
                {customer.fleet.units.length === 0 ? (
                  <p className="text-xs text-gray-400 mb-3">Sin unidades registradas.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {customer.fleet.units.map((u) => (
                      <div key={u.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                        <p className="font-medium text-gray-900">{u.year} {u.make} {u.model}</p>
                        <p className="text-xs text-gray-400">{u.plate ?? 'Sin placas'} · {u.mileage?.toLocaleString() ?? '—'} km</p>
                      </div>
                    ))}
                  </div>
                )}
                <NuevaUnidadForm fleetId={customer.fleet.id} />
              </div>

              {/* Recent projects */}
              {customer.fleet.projects.length > 0 && (
                <div className="border-t border-gray-100 px-6 py-4">
                  <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Wrench className="h-4 w-4" /> Proyectos recientes
                  </p>
                  <div className="space-y-2">
                    {customer.fleet.projects.map((p) => (
                      <Link key={p.id} href={`/proyectos/${p.id}`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.fleetUnit.year} {p.fleetUnit.make} {p.fleetUnit.model} · {p.projectNumber}</p>
                        </div>
                        <ProjectStatusPill status={p.status} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    SOLD: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = { PENDING: 'Pendiente', SOLD: 'Vendido', CANCELLED: 'Cancelado' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}

function ProjectStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    WAITING_PARTS: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    OPEN: 'Abierto', IN_PROGRESS: 'En proceso', WAITING_PARTS: 'Esp. partes',
    COMPLETED: 'Completado', CANCELLED: 'Cancelado',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}
