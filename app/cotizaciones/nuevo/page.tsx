import { getCustomers } from '@/app/actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import NuevaCotizacionForm from './NuevaCotizacionForm';

export const dynamic = 'force-dynamic';

export default async function NuevaCotizacionPage() {
  const customers = await getCustomers();
  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/cotizaciones" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Cotización</h1>
          <p className="text-sm text-gray-500">Crea la cotización y luego agrega partes</p>
        </div>
      </div>
      <NuevaCotizacionForm customers={customers as any} />
    </div>
  );
}
