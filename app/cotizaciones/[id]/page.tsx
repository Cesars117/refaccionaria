import { getQuoteById, getCustomers } from '@/app/actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import QuoteActions from './QuoteActions';
import QuoteHeader from './QuoteHeader';
import QuoteItemRow from './QuoteItemRow';
import AgregarItemForm from './AgregarItemForm';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, { label: string; class: string }> = {
  PENDING:   { label: 'Pendiente', class: 'bg-amber-100 text-amber-700' },
  SOLD:      { label: 'Vendida',   class: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelada', class: 'bg-red-100 text-red-700' },
};

export default async function CotizacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quote, customers] = await Promise.all([
    getQuoteById(id),
    getCustomers(),
  ]);

  if (!quote) notFound();

  const sc = STATUS[quote.status] ?? { label: quote.status, class: 'bg-gray-100 text-gray-600' };
  const isOpen = quote.status === 'PENDING';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="mb-4">
        <Link href="/cotizaciones" className="text-gray-400 hover:text-brand-600 flex items-center gap-1 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Volver a Cotizaciones
        </Link>
      </div>

      {/* Header Card */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sc.class}`}>
                {sc.label}
              </span>
            </div>
            <QuoteHeader quote={quote} customers={customers} />
          </div>
          <div className="shrink-0">
            <QuoteActions quoteId={quote.id} currentStatus={quote.status} />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="text-base font-semibold text-gray-900">Partidas</h2>
        </div>
        {quote.items.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-400">Sin partidas aún</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header px-4 py-2">Descripción</th>
                <th className="table-header px-3 py-2 text-right">Cant.</th>
                <th className="table-header px-3 py-2 text-right">P. Unit.</th>
                <th className="table-header px-3 py-2 text-right">Importe</th>
                {isOpen && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {quote.items.map((item) => (
                <QuoteItemRow key={item.id} item={item} isOpen={isOpen} />
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={isOpen ? 3 : 3} className="px-4 py-2 text-right text-xs text-gray-500">Subtotal</td>
                <td className="px-3 py-2 text-right text-sm">{formatCurrency(quote.subtotal)}</td>
                {isOpen && <td />}
              </tr>
              <tr>
                <td colSpan={isOpen ? 3 : 3} className="px-4 py-2 text-right text-xs text-gray-500">IVA 16%</td>
                <td className="px-3 py-2 text-right text-sm">{formatCurrency(quote.tax)}</td>
                {isOpen && <td />}
              </tr>
              <tr>
                <td colSpan={isOpen ? 3 : 3} className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Total</td>
                <td className="px-3 py-2 text-right text-base font-bold text-gray-900">{formatCurrency(quote.total)}</td>
                {isOpen && <td />}
              </tr>
            </tfoot>
          </table>
        )}

        {isOpen && (
          <div className="border-t border-gray-100 px-6 py-4">
            <AgregarItemForm quoteId={quote.id} />
          </div>
        )}
      </div>
    </div>
  );
}
