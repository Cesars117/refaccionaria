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
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-[#1b2742] bg-[#101a31] text-white h-full overflow-y-auto">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-white/10 bg-[linear-gradient(135deg,#0f1730_0%,#18284a_100%)] px-4">
        <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-[#0b1224] shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
          <Image
            src="/logoradiamex.jpg"
            alt="A/C Radiamex"
            fill
            className="object-contain p-1.5"
            priority
          />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">A/C Radiamex</h1>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#8aa3d4]">
            Radiadores y Enfriamiento
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-[#6f88b7]">
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
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[#8cb6ff]">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-white">A/C Radiamex</p>
            <p className="text-[10px] text-[#89a0c8]">www.radiamex.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
