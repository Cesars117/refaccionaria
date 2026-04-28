import { getCustomers } from '@/app/actions';
import Link from 'next/link';
import { Plus, Users, Truck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ClientesPage() {
  const customers = await getCustomers();
  const retail = customers.filter((c) => c.type === 'RETAIL');
  const fleet = customers.filter((c) => c.type === 'FLEET');

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">{customers.length} clientes registrados</p>
        </div>
        <Link href="/clientes/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" /> Nuevo Cliente
        </Link>
      </div>

      {/* Tabs summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{retail.length}</p>
            <p className="text-sm text-gray-500">Clientes Retail</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
            <Truck className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{fleet.length}</p>
            <p className="text-sm text-gray-500">Clientes con Flota</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {customers.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Sin clientes. <Link href="/clientes/nuevo" className="text-brand-600">Agrega uno.</Link>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header px-6 py-3">Nombre</th>
                <th className="table-header px-4 py-3">Tipo</th>
                <th className="table-header px-4 py-3">Teléfono</th>
                <th className="table-header px-4 py-3">Cotizaciones</th>
                <th className="table-header px-4 py-3">Flota</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.type === 'FLEET' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {c.type === 'FLEET' ? 'Flota' : 'Retail'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c._count.quotes}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {c.fleet ? (
                      <span>{c.fleet._count.units} unidades · {c.fleet._count.projects} proyectos</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/clientes/${c.id}`} className="text-sm text-brand-600 hover:text-brand-800 font-medium">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
