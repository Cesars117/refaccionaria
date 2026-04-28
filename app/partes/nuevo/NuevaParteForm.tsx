'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPart } from '@/app/actions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  categories: { id: number; name: string }[];
  locations: { id: number; name: string }[];
}

export default function NuevaParteForm({ categories, locations }: Props) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/partes" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Parte</h1>
          <p className="text-sm text-gray-500">Agregar refacción al catálogo</p>
        </div>
      </div>

      <form action={async (fd) => { setLoading(true); await createPart(fd); }} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label-field">Nombre *</label>
            <input name="name" required className="input-field" placeholder="Ej: Balata delantera" />
          </div>
          <div>
            <label className="label-field">SKU</label>
            <input name="sku" className="input-field" placeholder="Ej: BAL-001" />
          </div>
          <div>
            <label className="label-field">Número OEM</label>
            <input name="oemNumber" className="input-field" placeholder="Ej: 45022-SDA-A01" />
          </div>
          <div>
            <label className="label-field">Código de barras</label>
            <input name="barcode" className="input-field" />
          </div>
          <div>
            <label className="label-field">Marca</label>
            <input name="brand" className="input-field" placeholder="Ej: Wagner, Monroe, NGK" />
          </div>
          <div>
            <label className="label-field">Categoría *</label>
            <select name="categoryId" required className="input-field">
              <option value="">Seleccionar...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Ubicación *</label>
            <select name="locationId" required className="input-field">
              <option value="">Seleccionar...</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Costo</label>
            <input name="cost" type="number" step="0.01" min="0" defaultValue="0" className="input-field" />
          </div>
          <div>
            <label className="label-field">Precio público</label>
            <input name="price" type="number" step="0.01" min="0" defaultValue="0" className="input-field" />
          </div>
          <div>
            <label className="label-field">Precio flota</label>
            <input name="priceFleet" type="number" step="0.01" min="0" className="input-field" placeholder="Opcional" />
          </div>
          <div>
            <label className="label-field">Stock actual</label>
            <input name="quantity" type="number" min="0" defaultValue="0" className="input-field" />
          </div>
          <div>
            <label className="label-field">Stock mínimo</label>
            <input name="minStock" type="number" min="0" defaultValue="0" className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-field">Descripción</label>
            <textarea name="description" rows={3} className="input-field resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/partes" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : 'Guardar parte'}
          </button>
        </div>
      </form>
    </div>
  );
}
