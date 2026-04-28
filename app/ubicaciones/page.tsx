import { getLocations, createLocation, deleteLocation } from '@/app/actions';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

const TYPE_LABELS: Record<string, string> = {
  WAREHOUSE: 'Almacén',
  VEHICLE:   'Vehículo',
  SITE:      'Sitio',
};

export default async function UbicacionesPage() {
  const locations = await getLocations();

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ubicaciones</h1>
        <p className="text-sm text-gray-500">{locations.length} ubicaciones</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Nueva ubicación</h2>
          <form action={createLocation} className="space-y-3">
            <div>
              <label className="label-field">Nombre *</label>
              <input name="name" required className="input-field text-sm" placeholder="Ej: Bodega A" />
            </div>
            <div>
              <label className="label-field">Tipo</label>
              <select name="type" className="input-field text-sm">
                <option value="WAREHOUSE">Almacén</option>
                <option value="VEHICLE">Vehículo</option>
                <option value="SITE">Sitio</option>
              </select>
            </div>
            <div>
              <label className="label-field">Descripción</label>
              <input name="description" className="input-field text-sm" />
            </div>
            <button type="submit" className="btn-primary w-full text-sm">
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 card overflow-hidden">
          {locations.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-gray-400">Sin ubicaciones</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header px-4 py-3">Nombre</th>
                  <th className="table-header px-3 py-3">Tipo</th>
                  <th className="table-header px-3 py-3 text-right">Partes</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {locations.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{l.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{TYPE_LABELS[l.type] ?? l.type}</td>
                    <td className="px-3 py-2 text-right text-sm text-gray-600">{(l as any)._count?.parts ?? 0}</td>
                    <td className="px-3 py-2 text-right">
                      <form action={deleteLocation}>
                        <input type="hidden" name="id" value={l.id} />
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
