import { getCustomerById } from '@/app/actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

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
        <div className="space-y-4 lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Datos del cliente</h2>
              <dl className="space-y-2 text-sm">
                {customer.address && (
                  <div>
                    <dt className="text-gray-400">Dirección</dt>
                    <dd className="text-gray-900 break-words">{customer.address}</dd>
                  </div>
                )}
                {customer.rfc && (
                  <div>
                    <dt className="text-gray-400">RFC</dt>
                    <dd className="text-gray-900 break-words">{customer.rfc}</dd>
                  </div>
                )}
                {customer.notes && (
                  <div>
                    <dt className="text-gray-400">Notas</dt>
                    <dd className="text-gray-900 mt-1">{renderNotes(customer.notes)}</dd>
                  </div>
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
        </div>
      </div>
    </div>
  );
}

function renderNotes(notes: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = notes.match(urlRegex);
  if (matches) {
    let cleanText = notes;
    matches.forEach(url => {
      cleanText = cleanText.replace(url, '');
    });
    
    return (
      <div className="space-y-2">
        {cleanText.trim() && (
          <p className="text-gray-900 break-words whitespace-pre-line">{cleanText.trim()}</p>
        )}
        <div className="pt-1 flex flex-col gap-1.5">
          {matches.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-[11px] font-bold transition-all w-fit break-all"
            >
              <MapPin size={12} className="text-brand-600 shrink-0" />
              Ver Ubicación en Google Maps
            </a>
          ))}
        </div>
      </div>
    );
  }
  return <p className="text-gray-900 break-words whitespace-pre-line">{notes}</p>;
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
