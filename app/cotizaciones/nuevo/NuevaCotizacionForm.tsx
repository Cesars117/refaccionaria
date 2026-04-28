'use client';

import { useState } from 'react';
import { createQuote } from '@/app/actions';
import Link from 'next/link';

interface Customer { id: string; name: string; }

export default function NuevaCotizacionForm({ customers }: { customers: Customer[] }) {
  const [loading, setLoading] = useState(false);

  return (
    <form
      action={async (fd) => { setLoading(true); await createQuote(fd); }}
      className="card p-6 space-y-5"
    >
      <div className="space-y-4">
        <div>
          <label className="label-field">Cliente *</label>
          <select name="customerId" required className="input-field">
            <option value="">Seleccionar cliente...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">Referencia del vehículo</label>
          <input name="vehicleRef" className="input-field" placeholder="Ej: Nissan Sentra 2018 placas ABC-123" />
        </div>
        <div>
          <label className="label-field">Notas</label>
          <textarea name="notes" rows={2} className="input-field resize-none" />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Link href="/cotizaciones" className="btn-secondary">Cancelar</Link>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creando...' : 'Crear cotización'}
        </button>
      </div>
    </form>
  );
}
