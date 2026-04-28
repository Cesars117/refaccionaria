import { getProjects } from '@/app/actions';
import Link from 'next/link';
import { Plus, Wrench, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  OPEN:          { label: 'Abierto',      class: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS:   { label: 'En proceso',   class: 'bg-amber-100 text-amber-700' },
  WAITING_PARTS: { label: 'Esp. partes',  class: 'bg-orange-100 text-orange-700' },
  COMPLETED:     { label: 'Completado',   class: 'bg-green-100 text-green-700' },
  CANCELLED:     { label: 'Cancelado',    class: 'bg-red-100 text-red-700' },
};

const PRIORITY_CONFIG: Record<string, { label: string; class: string }> = {
  LOW:    { label: 'Baja',    class: 'bg-gray-100 text-gray-600' },
  NORMAL: { label: 'Normal',  class: 'bg-blue-50 text-blue-600' },
  HIGH:   { label: 'Alta',    class: 'bg-orange-100 text-orange-700' },
  URGENT: { label: 'Urgente', class: 'bg-red-100 text-red-700' },
};

export default async function ProyectosPage() {
  const projects = await getProjects();

  const open    = projects.filter((p) => p.status === 'OPEN').length;
  const inProg  = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const waiting = projects.filter((p) => p.status === 'WAITING_PARTS').length;
  const done    = projects.filter((p) => p.status === 'COMPLETED').length;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proyectos de Mantenimiento</h1>
          <p className="text-sm text-gray-500">{projects.length} proyectos en total</p>
        </div>
        <Link href="/proyectos/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" /> Nuevo Proyecto
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Abiertos',     value: open,    color: 'blue' },
          { label: 'En proceso',   value: inProg,  color: 'amber' },
          { label: 'Esp. partes',  value: waiting, color: 'orange' },
          { label: 'Completados',  value: done,    color: 'green' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="card py-12 text-center text-sm text-gray-400">
          Sin proyectos. <Link href="/proyectos/nuevo" className="text-brand-600">Crea el primero.</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header px-6 py-3">Proyecto</th>
                <th className="table-header px-4 py-3">Unidad</th>
                <th className="table-header px-4 py-3">Flota / Cliente</th>
                <th className="table-header px-4 py-3">Prioridad</th>
                <th className="table-header px-4 py-3">Estado</th>
                <th className="table-header px-4 py-3">Partes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {projects.map((p) => {
                const sc = STATUS_CONFIG[p.status] ?? { label: p.status, class: 'bg-gray-100 text-gray-600' };
                const pc = PRIORITY_CONFIG[p.priority] ?? { label: p.priority, class: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.projectNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.fleetUnit.year} {p.fleetUnit.make} {p.fleetUnit.model}
                      {p.fleetUnit.plate && <span className="ml-1 text-xs text-gray-400">({p.fleetUnit.plate})</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <p>{p.fleet.name}</p>
                      <p className="text-xs text-gray-400">{p.fleet.customer.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${pc.class}`}>
                        {pc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.class}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p._count.parts}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/proyectos/${p.id}`} className="text-sm text-brand-600 hover:text-brand-800 font-medium inline-flex items-center gap-1">
                        Ver <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
