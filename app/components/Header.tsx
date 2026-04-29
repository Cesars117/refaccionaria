'use client';

import { Bell, Search, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { normalizeRole } from '@/lib/rbac';

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const roleLabel: Record<string, string> = {
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    TRABAJADOR: 'Trabajador',
  };

  const role = normalizeRole(session?.user?.role);
  
  const getTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/items')) return 'Inventario';
    if (pathname.startsWith('/clients')) return 'Clientes';
    if (pathname.startsWith('/projects')) return 'Proyectos';
    if (pathname.startsWith('/purchases')) return 'Compras';
    if (pathname.startsWith('/site-kits')) return 'Site Kits';
    if (pathname.startsWith('/finance')) return 'Finanzas';
    if (pathname.startsWith('/audit-log')) return 'Audit Log';
    if (pathname.startsWith('/reportes')) return 'Reportes';
    return 'A/C Radiamex';
  };

  return (
    <header className="hidden lg:flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8">
      <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
        {getTitle()}
      </h2>


      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="h-9 w-64 rounded-full bg-gray-100 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>

        <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5 text-gray-500" />
        </button>

        <div className="h-8 w-px bg-gray-200 mx-1" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-900">{session?.user?.name ?? 'Usuario'}</p>
            <p className="text-[10px] text-gray-500">{roleLabel[role]}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 border border-gray-200">
            <User className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      </div>
    </header>
  );
}
