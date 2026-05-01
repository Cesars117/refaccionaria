import { getCategories, createCategory, updateCategory, deleteCategory } from '@/app/actions';
import { DeleteButton } from '@/app/components/DeleteButton';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CategoriasPage() {
  const categories = await getCategories();

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
        <p className="text-sm text-gray-500">{categories.length} categorías</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Nueva categoría</h2>
          <form action={createCategory} className="space-y-3">
            <div>
              <label className="label-field">Nombre *</label>
              <input name="name" required className="input-field text-sm" placeholder="Ej: Frenos" />
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
          {categories.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-gray-400">Sin categorías</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header px-4 py-3">Nombre</th>
                  <th className="table-header px-3 py-3">Descripción</th>
                  <th className="table-header px-3 py-3 text-right">Partes</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2" colSpan={2}>
                      <form action={updateCategory} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={c.id} />
                        <input name="name" defaultValue={c.name} className="input-field h-8 text-xs w-32" required />
                        <input name="description" defaultValue={c.description ?? ''} placeholder="Descripción" className="input-field h-8 text-xs flex-1" />
                        <button type="submit" className="btn-secondary h-8 text-xs px-2">Guardar</button>
                      </form>
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-gray-600">{(c as any)._count?.parts ?? 0}</td>
                    <td className="px-3 py-2 text-right">
                      <DeleteButton id={c.id} type="category" partsCount={(c as any)._count?.parts ?? 0} />
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
