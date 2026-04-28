'use client';

import { useState } from 'react';
import { createFleetUnit } from '@/app/actions';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';

export default function NuevaUnidadForm({ fleetId }: { fleetId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full text-sm mb-2">
        <Plus className="h-4 w-4" /> Agregar unidad
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        fd.append('fleetId', fleetId);
        setLoading(true);
        await createFleetUnit(fd);
        setLoading(false);
        setOpen(false);
      }}
      className="rounded-lg border border-brand-200 bg-brand-50 p-4 mb-3 space-y-3"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-gray-700">Nueva unidad</p>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label-field">Año *</label>
          <input name="year" required type="number" min="1900" max="2099" className="input-field text-sm" placeholder="2020" />
        </div>
        <div>
          <label className="label-field">Marca *</label>
          <input name="make" required className="input-field text-sm" placeholder="Nissan" />
        </div>
        <div>
          <label className="label-field">Modelo *</label>
          <input name="model" required className="input-field text-sm" placeholder="NP300" />
        </div>
        <div>
          <label className="label-field">Placas</label>
          <input name="plate" className="input-field text-sm" placeholder="ABC-123" />
        </div>
        <div>
          <label className="label-field">VIN</label>
          <input name="vin" className="input-field text-sm" />
        </div>
        <div>
          <label className="label-field">Km actuales</label>
          <input name="mileage" type="number" min="0" className="input-field text-sm" />
        </div>
        <div>
          <label className="label-field">Motor</label>
          <input name="engine" className="input-field text-sm" placeholder="2.5L Diesel" />
        </div>
        <div>
          <label className="label-field">Color</label>
          <input name="color" className="input-field text-sm" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm py-1.5">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary text-sm py-1.5">
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
