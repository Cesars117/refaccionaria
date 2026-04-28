'use client';

import { useState } from 'react';
import { createCustomer } from '@/app/actions';
import Link from 'next/link';

export default function NuevoClienteForm() {
  const [type, setType] = useState('RETAIL');
  const [loading, setLoading] = useState(false);

  return (
    <form action={async (fd) => { setLoading(true); await createCustomer(fd); }} className="card p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label-field">Tipo de cliente *</label>
          <div className="flex gap-3">
            {[{ v: 'RETAIL', l: 'Retail (público general)' }, { v: 'FLEET', l: 'Flota (empresa)' }].map(({ v, l }) => (
              <label key={v} className={`flex-1 flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                type === v ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input type="radio" name="type" value={v} checked={type === v} onChange={() => setType(v)} className="sr-only" />
                <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  type === v ? 'border-brand-600' : 'border-gray-300'
                }`}>
                  {type === v && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                </span>
                <span className="text-sm font-medium">{l}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="label-field">Nombre / Razón social *</label>
          <input name="name" required className="input-field" placeholder="Ej: Transportes García SA de CV" />
        </div>
        <div>
          <label className="label-field">Teléfono *</label>
          <input name="phone" required className="input-field" placeholder="Ej: 618-123-4567" />
        </div>
        <div>
          <label className="label-field">Email</label>
          <input name="email" type="email" className="input-field" />
        </div>
        <div className="sm:col-span-2">
          <label className="label-field">Dirección</label>
          <input name="address" className="input-field" />
        </div>
        <div>
          <label className="label-field">RFC</label>
          <input name="rfc" className="input-field" placeholder="Opcional para factura" />
        </div>

        {type === 'FLEET' && (
          <div>
            <label className="label-field">Nombre de la flota</label>
            <input name="fleetName" className="input-field" placeholder="Ej: Flota Norte" />
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="label-field">Notas</label>
          <textarea name="notes" rows={2} className="input-field resize-none" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Link href="/clientes" className="btn-secondary">Cancelar</Link>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Guardando...' : 'Crear cliente'}
        </button>
      </div>
    </form>
  );
}
