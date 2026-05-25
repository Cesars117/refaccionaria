import { getPendingDeliveriesAndPickups, getActiveDrivers, getActiveRoutesWithStops } from '@/app/actions';
import DispatchConsole from './DispatchConsole';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DespachoPage() {
  const session = await getServerSession(authOptions);
  
  // Redirigir si no tiene permisos
  const role = session?.user?.role;
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'DISPATCH') {
    redirect('/');
  }

  const [{ deliveries, supplierPickups }, drivers, activeRoutes] = await Promise.all([
    getPendingDeliveriesAndPickups(),
    getActiveDrivers(),
    getActiveRoutesWithStops()
  ]);

  // Convertir a objetos planos
  const plainDeliveries = JSON.parse(JSON.stringify(deliveries));
  const plainSupplierPickups = JSON.parse(JSON.stringify(supplierPickups));
  const plainDrivers = JSON.parse(JSON.stringify(drivers));
  const plainActiveRoutes = JSON.parse(JSON.stringify(activeRoutes));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Consola de Despacho y Logística</h1>
        <p className="text-sm text-gray-500">Planifica las rutas de entrega a clientes, recolecciones con proveedor y haz el seguimiento de choferes en tiempo real.</p>
      </div>

      <DispatchConsole 
        initialDeliveries={plainDeliveries} 
        initialPickups={plainSupplierPickups} 
        drivers={plainDrivers} 
        initialActiveRoutes={plainActiveRoutes}
      />
    </div>
  );
}
