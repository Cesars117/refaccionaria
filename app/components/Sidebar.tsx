'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  Car,
  FileText,
  Tag,
  MapPin,
  Truck,
  TrendingUp,
  Building2,
  Shield,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { canManageUsers, canViewAudit } from '@/lib/rbac';

const navSections = [
  {
    label: 'VENTAS',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Partes', href: '/partes', icon: Package },
      { name: 'Cotizaciones', href: '/cotizaciones', icon: FileText },
      { name: 'Clientes', href: '/clientes', icon: Users },
    ],
  },
  {
    label: 'FLOTAS',
    items: [
      { name: 'Flotas', href: '/flotas', icon: Truck },
    ],
  },
  {
    label: 'CATÁLOGOS',
    items: [
      { name: 'Vehículos', href: '/vehiculos', icon: Car },
      { name: 'Categorías', href: '/categorias', icon: Tag },
      { name: 'Ubicaciones', href: '/ubicaciones', icon: MapPin },
      { name: 'Proveedores', href: '/proveedores', icon: Building2 },
    ],
  },
  {
    label: 'REPORTES',
    items: [
      { name: 'Reportes', href: '/reportes', icon: TrendingUp },
      { name: 'Auditoría', href: '/auditoria', icon: ClipboardList, requiresAudit: true },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { name: 'Usuarios', href: '/usuarios', icon: Shield, requiresAdmin: true },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.requiresAdmin && !canManageUsers(userRole)) return false;
        if (item.requiresAudit && !canViewAudit(userRole)) return false;
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white h-full overflow-y-auto">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-gray-100 px-4">
        <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-[#d7e3f8] bg-[linear-gradient(145deg,#edf3ff_0%,#dbe8ff_100%)] shadow-sm">
          <Image
            src="/logoradiamex.jpg"
            alt="A/C Radiamex"
            fill
            className="object-contain p-1.5"
            priority
          />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">A/C Radiamex</h1>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
            Radiadores y Enfriamiento
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {visibleSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {section.label}
            </p>
            {section.items.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(isActive ? 'sidebar-link-active' : 'sidebar-link')}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700">A/C Radiamex</p>
            <p className="text-[10px] text-gray-400">www.radiamex.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
