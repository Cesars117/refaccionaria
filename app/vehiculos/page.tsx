import { getVehicleModels, createVehicleModel, deleteVehicleModel } from '@/app/actions';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VehiculosPage() {
  const vehicles = await getVehicleModels();

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Vehículos</h1>
        <p className="text-sm text-gray-500">Modelos usados para compatibilidad de partes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add form */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Agregar modelo</h2>
          <form action={createVehicleModel} className="space-y-3">
            <div>
              <label className="label-field">Marca *</label>
              <input name="make" required className="input-field text-sm" placeholder="Ej: Nissan" />
            </div>
            <div>
              <label className="label-field">Modelo *</label>
              <input name="model" required className="input-field text-sm" placeholder="Ej: Sentra" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label-field">Año inicio *</label>
                <input name="yearStart" type="number" required min="1900" max="2100" className="input-field text-sm" placeholder="2015" />
              </div>
              <div>
                <label className="label-field">Año fin</label>
                <input name="yearEnd" type="number" min="1900" max="2100" className="input-field text-sm" placeholder="2019" />
              </div>
            </div>
            <div>
              <label className="label-field">Motor</label>
              <input name="engine" className="input-field text-sm" placeholder="Ej: 1.8L L4" />
            </div>
            <div>
              <label className="label-field">Trim/Versión</label>
              <input name="trim" className="input-field text-sm" placeholder="Ej: Advance, Exclusive" />
            </div>
            <button type="submit" className="btn-primary w-full text-sm">
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 card overflow-hidden">
          {vehicles.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-gray-400">Sin vehículos en el catálogo</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header px-4 py-3">Marca / Modelo</th>
                  <th className="table-header px-3 py-3">Años</th>
                  <th className="table-header px-3 py-3">Motor</th>
                  <th className="table-header px-3 py-3">Trim</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <p className="text-sm font-medium text-gray-900">{v.make} {v.model}</p>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {v.yearStart}{v.yearEnd ? `–${v.yearEnd}` : '+'}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">{v.engine ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{v.trim ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <form action={deleteVehicleModel}>
                        <input type="hidden" name="id" value={v.id} />
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
