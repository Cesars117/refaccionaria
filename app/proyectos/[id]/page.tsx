import { getProjectById } from '@/app/actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ProjectActions from './ProjectActions';
import AgregarParteForm from './AgregarParteForm';

export const dynamic = 'force-dynamic';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  OPEN:          { label: 'Abierto',      class: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS:   { label: 'En proceso',   class: 'bg-amber-100 text-amber-700' },
  WAITING_PARTS: { label: 'Esp. partes',  class: 'bg-orange-100 text-orange-700' },
  COMPLETED:     { label: 'Completado',   class: 'bg-green-100 text-green-700' },
  CANCELLED:     { label: 'Cancelado',    class: 'bg-red-100 text-red-700' },
};

export default async function ProyectoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  const sc = STATUS_CONFIG[project.status] ?? { label: project.status, class: 'bg-gray-100 text-gray-600' };
  const totalCost = project.parts.reduce((s, pp) => s + pp.unitPrice * pp.quantity, 0);
  const isCompleted = project.status === 'COMPLETED' || project.status === 'CANCELLED';

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/proyectos" className="mt-1 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.class}`}>
                {sc.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {project.projectNumber} · {project.fleet.customer.name} / {project.fleet.name}
            </p>
          </div>
        </div>
        <ProjectActions projectId={project.id} currentStatus={project.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit info */}
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Unidad</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-gray-400">Vehículo</dt><dd className="font-medium">{project.fleetUnit.year} {project.fleetUnit.make} {project.fleetUnit.model}</dd></div>
              {project.fleetUnit.plate && <div className="flex justify-between"><dt className="text-gray-400">Placas</dt><dd>{project.fleetUnit.plate}</dd></div>}
              {project.fleetUnit.vin && <div className="flex justify-between"><dt className="text-gray-400">VIN</dt><dd className="font-mono text-xs">{project.fleetUnit.vin}</dd></div>}
              {project.mileageAtService && <div className="flex justify-between"><dt className="text-gray-400">Km en servicio</dt><dd>{project.mileageAtService.toLocaleString()}</dd></div>}
            </dl>
          </div>
          {project.description && (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h2>
              <p className="text-sm text-gray-600">{project.description}</p>
            </div>
          )}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Resumen</h2>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total partes:</span>
              <span className="font-semibold">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>

        {/* Parts list */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4" /> Partes del proyecto
              </h2>
            </div>

            {project.parts.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">Sin partes agregadas aún</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header px-4 py-2">Parte</th>
                    <th className="table-header px-3 py-2 text-right">Cant.</th>
                    <th className="table-header px-3 py-2 text-right">P. Unit.</th>
                    <th className="table-header px-3 py-2 text-right">Total</th>
                    {!isCompleted && <th className="px-3 py-2" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {project.parts.map((pp) => (
                    <tr key={pp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <p className="text-sm font-medium text-gray-900">{pp.part.name}</p>
                        <p className="text-xs text-gray-400">{pp.part.category?.name} · {pp.part.sku ?? ''}</p>
                      </td>
                      <td className="px-3 py-2 text-right text-sm">{pp.quantity}</td>
                      <td className="px-3 py-2 text-right text-sm">{formatCurrency(pp.unitPrice)}</td>
                      <td className="px-3 py-2 text-right text-sm font-medium">{formatCurrency(pp.quantity * pp.unitPrice)}</td>
                      {!isCompleted && (
                        <td className="px-3 py-2 text-right">
                          <form action={async (fd) => { 'use server'; const { removeProjectPart } = await import('@/app/actions'); await removeProjectPart(fd); }}>
                            <input type="hidden" name="id" value={pp.id} />
                            <button type="submit" className="text-xs text-red-500 hover:text-red-700">Quitar</button>
                          </form>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Total:</td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">{formatCurrency(totalCost)}</td>
                    {!isCompleted && <td />}
                  </tr>
                </tfoot>
              </table>
            )}

            {!isCompleted && (
              <div className="border-t border-gray-100 px-6 py-4">
                <AgregarParteForm projectId={project.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
