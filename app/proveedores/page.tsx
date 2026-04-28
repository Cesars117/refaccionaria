import { getSuppliers, createSupplier, deleteSupplier } from '@/app/actions';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProveedoresPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
        <p className="text-sm text-gray-500">{suppliers.length} proveedores</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Nuevo proveedor</h2>
          <form action={createSupplier} className="space-y-3">
            <div>
              <label className="label-field">Nombre *</label>
              <input name="name" required className="input-field text-sm" />
            </div>
            <div>
              <label className="label-field">Teléfono</label>
              <input name="phone" className="input-field text-sm" />
            </div>
            <div>
              <label className="label-field">Email</label>
              <input name="email" type="email" className="input-field text-sm" />
            </div>
            <div>
              <label className="label-field">Notas</label>
              <input name="notes" className="input-field text-sm" />
            </div>
            <button type="submit" className="btn-primary w-full text-sm">
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 card overflow-hidden">
          {suppliers.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-gray-400">Sin proveedores registrados</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header px-4 py-3">Nombre</th>
                  <th className="table-header px-3 py-3">Teléfono</th>
                  <th className="table-header px-3 py-3">Email</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{s.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{s.phone ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{s.email ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <form action={deleteSupplier}>
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
