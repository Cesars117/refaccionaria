import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCustomers } from '@/app/actions';
import NuevoClienteForm from './NuevoClienteForm';

export const dynamic = 'force-dynamic';

export default async function NuevoClientePage() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/clientes" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Cliente</h1>
          <p className="text-sm text-gray-500">Retail o cliente de flota</p>
        </div>
      </div>
      <NuevoClienteForm />
    </div>
  );
}
