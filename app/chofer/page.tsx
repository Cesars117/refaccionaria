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
        <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Ruta de Reparto</h1>
            <p className="text-xs text-slate-400">Chofer: {session.user.name}</p>
          </div>
          <span className="text-[10px] bg-brand-600 px-2.5 py-0.5 rounded-full text-white font-bold uppercase tracking-wider">
            {session.user.role || 'Repartidor'}
          </span>
        </header>

        <DriverConsole 
          driverId={driverId} 
          initialRoute={plainRoute} 
        />
      </div>
    </div>
  );
}
