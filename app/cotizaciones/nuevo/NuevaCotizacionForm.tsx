'use client';

import { useState } from 'react';
import { createQuote } from '@/app/actions';
import Link from 'next/link';

interface Customer { id: string; name: string; }

export default function NuevaCotizacionForm({ customers }: { customers: Customer[] }) {
  const [loading, setLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  return (
    <form
      action={async (fd) => { setLoading(true); await createQuote(fd); }}
      className="card p-6 space-y-5"
    >
      <div className="space-y-4">
        <div>
          <label className="label-field">Cliente *</label>
          <select 
            name="customerId" 
            required 
            className="input-field"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            <option value="">Seleccionar cliente...</option>
            <option value="publico_general">⚡ Público General</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="mt-1.5">
            <button
              type="button"
              onClick={() => setSelectedCustomerId('publico_general')}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-bold transition-all inline-flex items-center gap-1 active:scale-95"
            >
              ⚡ Usar Público General
            </button>
          </div>
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
