'use client';

import { useState, useEffect } from 'react';
import { createProject } from '@/app/actions';
import Link from 'next/link';

interface FleetUnit { id: string; year: number; make: string; model: string; plate: string | null; }
interface Fleet { id: string; name: string; units: FleetUnit[]; }
interface Customer { id: string; name: string; fleet: Fleet | null; }

export default function NuevoProyectoForm({
  customers,
  defaultFleetId,
}: {
  customers: Customer[];
  defaultFleetId?: string;
}) {
  const [customerId, setCustomerId] = useState('');
  const [fleetId, setFleetId] = useState(defaultFleetId ?? '');
  const [unitId, setUnitId] = useState('');
  const [loading, setLoading] = useState(false);

  const fleet = customers.find((c) => c.fleet?.id === fleetId)?.fleet ?? null;

  // If defaultFleetId provided, auto-select customer
  useEffect(() => {
    if (defaultFleetId) {
      const c = customers.find((c) => c.fleet?.id === defaultFleetId);
      if (c) setCustomerId(c.id);
    }
  }, [defaultFleetId, customers]);

  return (
    <form
      action={async (fd) => {
        setLoading(true);
        await createProject(fd);
      }}
      className="card p-6 space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label-field">Cliente con flota *</label>
          <select
            required
            className="input-field"
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              const c = customers.find((c) => c.id === e.target.value);
              setFleetId(c?.fleet?.id ?? '');
              setUnitId('');
            }}
          >
            <option value="">Seleccionar cliente...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {fleet && (
          <>
            <input type="hidden" name="fleetId" value={fleetId} />
            <div className="sm:col-span-2">
              <label className="label-field">Unidad *</label>
              <select
                name="fleetUnitId"
                required
                className="input-field"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
              >
                <option value="">Seleccionar unidad...</option>
                {fleet.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.year} {u.make} {u.model} {u.plate ? `(${u.plate})` : ''}
                  </option>
                ))}
              </select>
              {fleet.units.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">Esta flota no tiene unidades. <Link href={`/clientes/${customerId}`} className="underline">Agregar unidades</Link>.</p>
              )}
            </div>
          </>
        )}

        <div className="sm:col-span-2">
          <label className="label-field">Nombre del proyecto *</label>
          <input name="name" required className="input-field" placeholder="Ej: Cambio de aceite y filtros" />
        </div>

        <div className="sm:col-span-2">
          <label className="label-field">Descripción</label>
          <textarea name="description" rows={2} className="input-field resize-none" placeholder="Síntomas, observaciones, trabajo a realizar..." />
        </div>

        <div>
          <label className="label-field">Prioridad</label>
          <select name="priority" className="input-field">
            <option value="LOW">Baja</option>
            <option value="NORMAL" selected>Normal</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>

        <div>
          <label className="label-field">Km en el momento del servicio</label>
          <input name="mileageAtService" type="number" min="0" className="input-field" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Link href="/proyectos" className="btn-secondary">Cancelar</Link>
        <button type="submit" disabled={loading || !fleet} className="btn-primary">
          {loading ? 'Creando...' : 'Crear proyecto'}
        </button>
      </div>
    </form>
  );
}
