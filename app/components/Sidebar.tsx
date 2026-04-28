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
  Wrench,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    label: 'FLOTAS & PROYECTOS',
    items: [
      { name: 'Flotas', href: '/flotas', icon: Truck },
      { name: 'Proyectos', href: '/proyectos', icon: Wrench },
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
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white h-full overflow-y-auto">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-4">
        <div className="relative h-10 w-10 overflow-hidden rounded-md border border-gray-200 bg-white">
          <Image
            src="/logoradiamex.jpg"
            alt="A/C Radiamex"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Radiamex</h1>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            A/C
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navSections.map((section) => (
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
