'use client';

import { useState } from 'react';
import { createCustomer } from '@/app/actions';
import Link from 'next/link';

export default function NuevoClienteForm() {
  const [loading, setLoading] = useState(false);

  return (
    <form action={async (fd) => { setLoading(true); await createCustomer(fd); }} className="card p-6 space-y-5">
      <input type="hidden" name="type" value="RETAIL" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label-field">Nombre / Razón social *</label>
          <input name="name" required className="input-field" placeholder="Ej: Juan Pérez" />
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
        <div className="sm:col-span-2">
          <label className="label-field">RFC</label>
          <input name="rfc" className="input-field" placeholder="Opcional para factura" />
        </div>

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
