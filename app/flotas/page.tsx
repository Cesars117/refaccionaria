import { getCustomers } from '@/app/actions';
import Link from 'next/link';
import { ArrowRight, Car, Wrench, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FlotasPage() {
  const customers = await getCustomers('FLEET') as any[];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flotas</h1>
          <p className="text-sm text-gray-500">{customers.length} clientes con flota</p>
        </div>
        <Link href="/clientes/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" /> Nuevo cliente flota
        </Link>
      </div>

      {customers.length === 0 ? (
        <div className="card py-12 text-center text-sm text-gray-400">
          Sin clientes de flota. <Link href="/clientes/nuevo" className="text-brand-600">Crear cliente.</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c: any) => {
            const fleet = c.fleet;
            const unitCount = fleet?._count?.units ?? fleet?.units?.length ?? 0;
            const projectCount = fleet?._count?.projects ?? fleet?.projects?.length ?? 0;
            return (
              <Link key={c.id} href={`/clientes/${c.id}`} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">{c.name}</h2>
                    <p className="text-sm text-gray-500">{fleet?.name ?? 'Flota'}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <Car className="h-4 w-4 text-gray-400 mx-auto mb-0.5" />
                    <p className="text-lg font-bold text-gray-900">{unitCount}</p>
                    <p className="text-xs text-gray-500">Unidades</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <Wrench className="h-4 w-4 text-gray-400 mx-auto mb-0.5" />
                    <p className="text-lg font-bold text-gray-900">{projectCount}</p>
                    <p className="text-xs text-gray-500">Proyectos</p>
                  </div>
                </div>
                {c.phone && <p className="mt-2 text-xs text-gray-400">{c.phone}</p>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
