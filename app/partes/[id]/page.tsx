import { getPartById, getCategories, getLocations, deletePart } from '@/app/actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import EditParteForm from './EditParteForm';

export const dynamic = 'force-dynamic';

export default async function ParteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  
  if (isNaN(id)) notFound();

  const [part, categories, locations] = await Promise.all([
    getPartById(id),
    getCategories(),
    getLocations(),
  ]);

  if (!part) notFound();

  // Serializar todo para el Client Component
  const serializedPart = JSON.parse(JSON.stringify(part));
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedLocations = JSON.parse(JSON.stringify(locations));

  const isLowStock = part.quantity <= part.minStock;

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/partes" className="mt-1 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{part.name}</h1>
            <p className="text-sm text-gray-500">
              {part.category?.name ?? 'Sin categoría'} · {part.location?.name ?? 'Sin ubicación'}
            </p>
          </div>
        </div>
        {isLowStock && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
            Stock bajo
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Quick stats */}
        {[
          { label: 'Stock',        value: `${part.quantity ?? 0} uds.`, highlight: isLowStock },
          { label: 'Precio',       value: formatCurrency(part.price ?? 0), highlight: false },
          { label: 'Precio flota', value: part.priceFleet ? formatCurrency(part.priceFleet) : '—', highlight: false },
        ].map((s) => (
          <div key={s.label} className={`card p-4 text-center ${s.highlight ? 'border-red-200' : ''}`}>
            <p className={`text-2xl font-bold ${s.highlight ? 'text-red-600' : 'text-gray-900'}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Edit className="h-4 w-4" /> Editar parte
        </h2>
        <EditParteForm 
          part={serializedPart} 
          categories={serializedCategories} 
          locations={serializedLocations} 
        />
      </div>

      {/* Danger zone */}
      <div className="mt-4 card p-4 border-red-100">
        <h3 className="text-sm font-semibold text-red-700 mb-2">Zona peligrosa</h3>
        <form action={deletePart}>
          <input type="hidden" name="id" value={part.id} />
          <button
            type="submit"
            className="text-sm text-red-600 hover:text-red-800 font-medium"
            onClick={(e) => { if (!confirm('¿Eliminar esta parte permanentemente?')) e.preventDefault(); }}
          >
            Eliminar parte
          </button>
        </form>
      </div>
    </div>
  );
}
