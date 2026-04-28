'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  BarChart3,
  Settings,
  Truck,
  ShoppingCart,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventario', href: '/items', icon: Package },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Proyectos', href: '/projects', icon: ClipboardList },
  { name: 'Compras', href: '/purchases', icon: ShoppingCart },
  { name: 'Site Kits', href: '/site-kits', icon: Truck },
  { name: 'Finanzas', href: '/finance', icon: BarChart3 },
  { name: 'Audit Log', href: '/audit-log', icon: ShieldCheck },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white h-full overflow-y-auto">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
          <Package className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Coyote</h1>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Refaccionaria
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                isActive ? 'sidebar-link-active' : 'sidebar-link'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700">Refaccionaria Coyote</p>
            <p className="text-[10px] text-gray-400">Control de Inventario</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
