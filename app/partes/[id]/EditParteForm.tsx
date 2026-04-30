'use client';

import { useState } from 'react';
import { updatePart } from '@/app/actions';

interface Category { id: number; name: string; }
interface Location { id: number; name: string; type: string; }

export default function EditParteForm({
  part,
  categories,
  locations,
}: {
  part: any;
  categories: Category[];
  locations: Location[];
}) {
  const [loading, setLoading] = useState(false);

  return (
    <form
      action={async (fd) => { setLoading(true); await updatePart(fd); }}
      className="space-y-4"
    >
      <input type="hidden" name="id" value={part.id} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label-field">Nombre *</label>
          <input name="name" required defaultValue={part.name} className="input-field" />
        </div>
        <div>
          <label className="label-field">SKU</label>
          <input name="sku" defaultValue={part.sku ?? ''} className="input-field" />
        </div>
        <div>
          <label className="label-field">Número OEM</label>
          <input name="oemNumber" defaultValue={part.oemNumber ?? ''} className="input-field" />
        </div>
        <div>
          <label className="label-field">Marca</label>
          <input name="brand" defaultValue={part.brand ?? ''} className="input-field" />
        </div>
        <div>
          <label className="label-field">Código de barras</label>
          <input name="barcode" defaultValue={part.barcode ?? ''} className="input-field" />
        </div>
        <div>
          <label className="label-field">Categoría *</label>
          <select name="categoryId" required defaultValue={part.categoryId ?? ''} className="input-field">
            <option value="" disabled>Seleccionar categoría...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-field">Ubicación *</label>
          <select name="locationId" required defaultValue={part.locationId ?? ''} className="input-field">
            <option value="" disabled>Seleccionar ubicación...</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-field">Stock actual</label>
          <input name="quantity" type="number" min="0" defaultValue={part.quantity} className="input-field" />
        </div>
        <div>
          <label className="label-field">Stock mínimo</label>
          <input name="minStock" type="number" min="0" defaultValue={part.minStock} className="input-field" />
        </div>
        <div>
          <label className="label-field">Precio público (MXN)</label>
          <input name="price" type="number" step="0.01" min="0" defaultValue={part.price} className="input-field" />
        </div>
        <div>
          <label className="label-field">Precio flota (MXN)</label>
          <input name="priceFleet" type="number" step="0.01" min="0" defaultValue={part.priceFleet ?? ''} className="input-field" />
        </div>
        <div>
          <label className="label-field">Costo (MXN)</label>
          <input name="cost" type="number" step="0.01" min="0" defaultValue={part.cost} className="input-field" />
        </div>
        <div className="sm:col-span-2">
          <label className="label-field">Descripción</label>
          <textarea name="description" rows={2} defaultValue={part.description ?? ''} className="input-field resize-none" />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
