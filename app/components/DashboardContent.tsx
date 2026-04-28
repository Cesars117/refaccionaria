'use client'

import { Package, BarChart3, Plus, Edit, ClipboardList, ShoppingCart, Users, ArrowUpRight, TrendingUp, DollarSign } from "lucide-react";
import Link from 'next/link';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { SearchModal } from './SearchModal';
import { useState } from 'react';

interface Item {
  id: number;
  name: string;
  description: string | null;
  barcode: string | null;
  quantity: number;
  status: string;
  unitType: string | null;
  unitsPerBox: number | null;
  totalUnits: number | null;
  sku: string | null;
  siteKitSku: string | null;
  category: { name: string };
  location: { name: string };
  serialNumbers: Array<{ id: number; serialNumber: string | null; tmoSerial: string | null }>;
}

function SearchModalWrapper({ items, query }: { items: Item[], query: string }) {
  const [isOpen, setIsOpen] = useState(true);
  if (!isOpen) return null;
  return (
    <SearchModal
      items={items}
      query={query}
      onClose={() => setIsOpen(false)}
    />
  );
}

interface DashboardContentProps {
  itemCount: number;
  clientCount: number;
  projectCount: number;
  totalValue: number;
  revenue: number;
  costs: number;
  displayItems: Item[];
  sectionTitleKey: string;
  query?: string;
}

export function DashboardContent({ 
  itemCount, 
  clientCount,
  projectCount,
  totalValue, 
  revenue,
  costs,
  displayItems,
  sectionTitleKey,
  query 
}: DashboardContentProps) {
  const { t } = useLanguage();
  const [selectedTableItem, setSelectedTableItem] = useState<Item | null>(null);

  const getSectionTitle = () => {
    if (query) return `${t('dashboard.searchResults')} (${displayItems.length})`;
    return t(sectionTitleKey);
  };

  return (
    <main className="p-8">
      {/* Header Section - Hunter Style */}

      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
        <div>
          <h1 className="heading-xl">Panel de Control</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Bienvenido a <strong>Refaccionaria Coyote</strong>. Resumen general de inventario y flotas.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/reportes" className="btn btn-secondary">
            <BarChart3 size={18} />
            Ver Reportes
          </Link>
          <Link href="/items/new" className="btn btn-primary">
            <Plus size={18} />
            {t('dashboard.newArticle')}
          </Link>
        </div>
      </header>

      {/* Stats Grid - Hunter Style */}
      <section className="grid-stats">
        <MetricCard 
          title="Inventario Total" 
          value={itemCount} 
          icon={<Package size={24} />} 
          color="blue" 
          subtitle="Artículos registrados"
        />
        <MetricCard 
          title="Ventas Totales" 
          value={`$${revenue.toLocaleString()}`} 
          icon={<TrendingUp size={24} />} 
          color="green" 
          subtitle="Ingresos brutos"
        />
        <MetricCard 
          title="Utilidad Neta" 
          value={`$${totalValue.toLocaleString()}`} 
          icon={<DollarSign size={24} />} 
          color="indigo" 
          subtitle="Margen de ganancia"
        />
        <MetricCard 
          title="Proyectos" 
          value={projectCount} 
          icon={<ClipboardList size={24} />} 
          color="orange" 
          subtitle="Órdenes activas"
        />
      </section>

      {/* Management Modules - Hunter Style */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 className="heading-lg" style={{ marginBottom: "1.25rem" }}>Gestión Operativa</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
          <ModuleLink 
            href="/clients" 
            title="Clientes y Flotas" 
            desc="Coyote, Nissan 300 y flotas externas" 
            icon={<Users size={22} />} 
            color="blue"
          />
          <ModuleLink 
            href="/projects" 
            title="Mantenimientos" 
            desc="Frenos, discos y radiadores" 
            icon={<ClipboardList size={22} />} 
            color="green"
          />
          <ModuleLink 
            href="/finance" 
            title="Finanzas Pro" 
            desc="Facturas, costos y balances" 
            icon={<BarChart3 size={22} />} 
            color="indigo"
          />
        </div>
      </section>

      {/* Recent Inventory Table - Hunter Style */}
      <section>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{getSectionTitle()}</span>
            <Link href="/items" style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
              Ver todo el inventario →
            </Link>
          </div>
          
          {displayItems.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              {t('dashboard.noItems')}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('common.barcode')}</th>
                    <th>{t('common.category')}</th>
                    <th>{t('common.location')}</th>
                    <th>{t('common.quantity')}</th>
                    <th>{t('common.status')}</th>
                    <th style={{ textAlign: "center" }}>{t('dashboard.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item) => (
                    <tr key={item.id} onClick={() => setSelectedTableItem(item)} style={{ cursor: 'pointer' }}>
                      <td className="font-medium">{item.name}</td>
                      <td>
                        <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem" }}>
                          {item.barcode || '—'}
                        </code>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{item.category.name}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{item.location.name}</td>
                      <td>
                        <span className="font-semibold">{item.quantity}</span>
                        <span style={{ color: "var(--text-muted)", marginLeft: "4px", fontSize: "0.75rem" }}>
                          {item.unitType?.toLowerCase() || 'und'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge badge-${item.status === 'AVAILABLE' ? 'success' : 'warning'}`}>
                          {t(`status.${item.status}`)}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Link href={`/items/${item.id}`} style={{ color: "var(--primary)" }}>
                          <Edit size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
      {(query && displayItems.length > 0) && <SearchModalWrapper key={query} items={displayItems} query={query} />}
      {selectedTableItem && <SearchModal items={[selectedTableItem]} query={selectedTableItem.name} onClose={() => setSelectedTableItem(null)} />}
    </main>
  );
}

function MetricCard({ title, value, icon, color, subtitle }: any) {
  const colors: any = {
    blue: { bg: "#eff6ff", text: "#2563eb" },
    green: { bg: "#ecfdf5", text: "#059669" },
    indigo: { bg: "#eef2ff", text: "#4f46e5" },
    orange: { bg: "#fff7ed", text: "#ea580c" }
  };
  const theme = colors[color] || colors.blue;

  return (
    <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.025em" }}>
          {title}
        </p>
        <h3 style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "0.25rem", color: "#111827" }}>{value}</h3>
        {subtitle && <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem" }}>{subtitle}</p>}
      </div>
      <div style={{ backgroundColor: theme.bg, color: theme.text, padding: "12px", borderRadius: "12px" }}>
        {icon}
      </div>
    </div>
  );
}

function ModuleLink({ href, title, desc, icon, color }: any) {
  const colors: any = {
    blue: "#2563eb",
    green: "#059669",
    indigo: "#4f46e5"
  };
  return (
    <Link href={href} className="card" style={{ textDecoration: 'none', color: 'inherit', padding: '1.25rem', display: "flex", alignItems: "center", gap: "1rem" }}>
      <div style={{ color: colors[color], backgroundColor: `${colors[color]}10`, padding: "10px", borderRadius: "10px" }}>
        {icon}
      </div>
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>{title}</h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>{desc}</p>
      </div>
      <ArrowUpRight size={16} style={{ marginLeft: "auto", color: "var(--text-muted)" }} />
    </Link>
  );
}
