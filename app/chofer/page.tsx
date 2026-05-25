import { getActiveRouteForDriver } from '@/app/actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DriverConsole from './DriverConsole';

export const dynamic = 'force-dynamic';

export default async function ChoferPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login?callbackUrl=%2Fchofer');
  }

  const driverId = session.user.id;
  const activeRoute = await getActiveRouteForDriver(driverId);
  
  // Convertir a objeto plano
  const plainRoute = activeRoute ? JSON.parse(JSON.stringify(activeRoute)) : null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 font-sans flex flex-col">
      <div className="max-w-md mx-auto w-full flex-grow flex flex-col">
        <DriverConsole 
          driverId={driverId} 
          driverName={session.user.name ?? 'Chofer'}
          driverRole={session.user.role ?? 'DRIVER'}
          initialRoute={plainRoute} 
        />
      </div>
    </div>
  );
}
