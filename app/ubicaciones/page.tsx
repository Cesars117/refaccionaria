import { getLocations, createLocation, updateLocation, deleteLocation } from '@/app/actions';
import { DeleteButton } from '@/app/components/DeleteButton';
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
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/2">Gestión de Ubicación</th>
                  <th className="px-3 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/4">Partes</th>
                  <th className="px-3 py-3 w-1/4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {locations.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <form action={updateLocation} className="grid grid-cols-1 gap-2">
                        <input type="hidden" name="id" value={l.id} />
                        <div className="flex gap-2">
                          <input name="name" defaultValue={l.name} className="input-field h-8 text-xs flex-1" required placeholder="Nombre" />
                          <select name="type" defaultValue={l.type} className="input-field py-1 text-xs w-32 min-w-[120px]">
                            <option value="WAREHOUSE">Almacén</option>
                            <option value="VEHICLE">Vehículo</option>
                            <option value="SITE">Sitio</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <input name="description" defaultValue={l.description ?? ''} placeholder="Descripción" className="input-field h-8 text-xs flex-1" />
                          <button type="submit" className="btn-secondary h-8 text-xs px-3">Guardar</button>
                        </div>
                      </form>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-gray-600">{(l as any)._count?.parts ?? 0}</td>
                    <td className="px-3 py-3 text-right">
                      <DeleteButton id={l.id} type="location" partsCount={(l as any)._count?.parts ?? 0} />
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
