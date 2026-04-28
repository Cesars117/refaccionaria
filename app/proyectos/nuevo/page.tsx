import { getCustomers } from '@/app/actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import NuevoProyectoForm from './NuevoProyectoForm';

export const dynamic = 'force-dynamic';

export default async function NuevoProyectoPage({ searchParams }: { searchParams: Promise<{ fleetId?: string }> }) {
  const sp = await searchParams;
  // Load fleet customers
  const customers = await getCustomers('FLEET');

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/proyectos" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Proyecto</h1>
          <p className="text-sm text-gray-500">Proyecto de mantenimiento para una unidad de flota</p>
        </div>
      </div>
      <NuevoProyectoForm customers={customers as any} defaultFleetId={sp.fleetId} />
    </div>
  );
}
