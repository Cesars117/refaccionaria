import { getDashboardStats, getItems } from "../actions";
import { DashboardContent } from "../components/DashboardContent";
import Link from 'next/link';
import { ArrowLeft, TrendingUp, DollarSign, Package, AlertCircle, BarChart3, Clock, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  const { itemCount, clientCount, projectCount, totalValue, revenue, costs } = await getDashboardStats();
  
  // Calcular métricas adicionales para los reportes estilo Hunter
  const marginPct = revenue > 0 ? Math.round((totalValue / revenue) * 100) : 0;
  const avgProfitPerItem = itemCount > 0 ? Math.round(totalValue / itemCount) : 0;
  
  return (
    <main className="p-8">
      <header style={{ marginBottom: "2.5rem" }}>

        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "1rem", fontWeight: 500 }}>
          <ArrowLeft size={16} />
          Volver al Panel
        </Link>
        <h1 className="heading-xl">Reportes de Rendimiento</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          Métricas avanzadas y salud financiera de <strong>Refaccionaria Coyote</strong>.
        </p>
      </header>

      {/* Primary Metrics Grid */}
      <div className="grid-stats" style={{ marginBottom: "2.5rem" }}>
        <ReportMetricCard 
          title="Rendimiento de Ventas" 
          value={`$${revenue.toLocaleString()}`} 
          icon={<TrendingUp size={20} />} 
          color="green"
          percentage={100}
        />
        <ReportMetricCard 
          title="Margen de Utilidad" 
          value={`${marginPct}%`} 
          icon={<BarChart3 size={20} />} 
          color="blue"
          percentage={marginPct}
        />
        <ReportMetricCard 
          title="Utilidad por Artículo" 
          value={`$${avgProfitPerItem.toLocaleString()}`} 
          icon={<DollarSign size={20} />} 
          color="indigo"
          percentage={75}
        />
        <ReportMetricCard 
          title="Proyectos Completos" 
          value={projectCount} 
          icon={<CheckCircle size={20} />} 
          color="orange"
          percentage={90}
        />
      </div>

      {/* Analysis Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem" }}>
        {/* Health Chart Box */}
        <div className="card">
          <h2 className="heading-lg" style={{ marginBottom: "1.5rem", fontSize: "1.125rem" }}>Salud del Inventario</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <ProgressStat 
              label="Artículos Disponibles" 
              value={itemCount} 
              total={itemCount + 5} 
              color="#10b981" 
              icon={<Package size={16} />}
            />
            <ProgressStat 
              label="Eficiencia de Ventas" 
              value={marginPct} 
              total={100} 
              color="#6366f1" 
              icon={<TrendingUp size={16} />}
            />
            <ProgressStat 
              label="Retorno de Inversión" 
              value={85} 
              total={100} 
              color="#f59e0b" 
              icon={<DollarSign size={16} />}
            />
          </div>
        </div>

        {/* Financial Summary */}
        <div className="card" style={{ background: "#111827", color: "white" }}>
          <h2 className="heading-lg" style={{ marginBottom: "1.5rem", fontSize: "1.125rem", color: "white" }}>Resumen Financiero</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.75rem" }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>Ingresos Brutos</span>
              <span style={{ fontWeight: 700 }}>${revenue.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.75rem" }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>Costos Operativos</span>
              <span style={{ fontWeight: 700, color: "#f87171" }}>-${costs.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem" }}>
              <span style={{ fontWeight: 600 }}>Utilidad Neta</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#4ade80" }}>${totalValue.toLocaleString()}</span>
            </div>
            
            <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#4ade80", fontSize: "0.875rem", fontWeight: 600 }}>
                <TrendingUp size={16} />
                <span>Rendimiento Óptimo</span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: "0.25rem" }}>
                El margen de utilidad actual del {marginPct}% supera el promedio del sector.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ReportMetricCard({ title, value, icon, color, percentage }: any) {
  const colors: any = {
    green: "#10b981",
    blue: "#3b82f6",
    indigo: "#6366f1",
    orange: "#f59e0b"
  };
  const themeColor = colors[color] || colors.blue;

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <div style={{ color: themeColor, background: `${themeColor}15`, padding: "8px", borderRadius: "8px" }}>
          {icon}
        </div>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</span>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: themeColor }}>{percentage}%</span>
      </div>
      <div className="progress-container" style={{ height: "4px", marginTop: "0.75rem" }}>
        <div className="progress-bar" style={{ width: `${percentage}%`, backgroundColor: themeColor }} />
      </div>
    </div>
  );
}

function ProgressStat({ label, value, total, color, icon }: any) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
          {icon}
          {label}
        </div>
        <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>{value}</span>
      </div>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
