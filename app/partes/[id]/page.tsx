import { getPartById, getCategories, getLocations, deletePart } from '@/app/actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import EditParteForm from './EditParteForm';

export const dynamic = 'force-dynamic';

export default async function ParteDetailPage({ params }: any) {
  try {
    const resolvedParams = await params;
    const idStr = resolvedParams?.id;
    const id = parseInt(idStr);
    
    if (isNaN(id)) return <div>ID inválido</div>;

    const part = await getPartById(id);
    if (!part) return <div>Parte no encontrada</div>;

    const categories = await getCategories();
    const locations = await getLocations();

    // Serializar para evitar problemas de tipos de Prisma en el cliente
    const serializedPart = JSON.parse(JSON.stringify(part));
    const serializedCategories = JSON.parse(JSON.stringify(categories));
    const serializedLocations = JSON.parse(JSON.stringify(locations));

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
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Edit className="h-4 w-4" /> Editar parte (v2.4)
          </h2>
          <EditParteForm 
            part={serializedPart} 
            categories={serializedCategories} 
            locations={serializedLocations} 
          />
        </div>

        <div className="mt-8 text-[8px] text-gray-300 text-right">
          Build v2.4 | ID: {id}
        </div>
      </div>
    );
  } catch (error: any) {
    console.error("CRITICAL PAGE ERROR:", error);
    return (
      <div className="p-10 text-red-600 bg-red-50 rounded-lg border border-red-200">
        <h1 className="text-xl font-bold mb-2">Error al cargar la página</h1>
        <p className="text-sm">Lo sentimos, ha ocurrido un error interno.</p>
        <pre className="mt-4 p-2 bg-white text-[10px] overflow-auto">
          {error.message}
        </pre>
        <Link href="/partes" className="mt-4 inline-block text-brand-600 font-medium">
          ← Volver al inventario
        </Link>
      </div>
    );
  }
}
