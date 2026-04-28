'use client'

import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, FileText, Calendar, User } from 'lucide-react'

interface Invoice {
  id: number
  invoiceNumber: string
  total: number
  status: string
  client: { name: string }
  project: { name: string; id: number } | null
  createdAt: Date
}

interface FinancePageClientProps {
  stats: any

  invoices: Invoice[]
}

export function FinancePageClient({ stats, invoices }: FinancePageClientProps) {
  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
        <ArrowLeft size={20} />
        Regresar al Dashboard
      </Link>

      <h1 className="heading-xl">Finanzas y Control</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "3rem" }}>Monitoreo de ventas, márgenes y facturación interna.</p>

      {/* Stats Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
        <div className="card" style={{ padding: "2rem", borderLeft: "4px solid var(--success)" }}>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Total Ventas (Refacciones)</div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--success)" }}>${stats.revenue.toLocaleString()}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--success)", fontSize: "0.875rem", marginTop: "1rem" }}>
             <TrendingUp size={16} />
             <span>Ingresos Totales</span>
          </div>
        </div>

        <div className="card" style={{ padding: "2rem", borderLeft: "4px solid var(--primary)" }}>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Margen Bruto Estimado</div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)" }}>${stats.totalValue.toLocaleString()}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--primary)", fontSize: "0.875rem", marginTop: "1rem" }}>
             <TrendingUp size={16} />
             <span>Utilidad sobre Refacciones</span>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <section>
        <h2 className="heading-lg" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "12px" }}>
          <FileText size={24} color="var(--primary)" />
          Historial de Facturación Interna
        </h2>
        
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
           <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                 <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-light)" }}>
                    <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600 }}>FACTURA</th>
                    <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600 }}>CLIENTE</th>
                    <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600 }}>PROYECTO</th>
                    <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600 }}>FECHA</th>
                    <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600, textAlign: "right" }}>TOTAL</th>
                 </tr>
              </thead>
              <tbody>
                 {invoices.length === 0 ? (
                    <tr>
                       <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No hay facturas registradas.</td>
                    </tr>
                 ) : (
                    invoices.map(inv => (
                       <tr key={inv.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.2s" }}>
                          <td style={{ padding: "16px 24px", fontWeight: 600 }}>{inv.invoiceNumber}</td>
                          <td style={{ padding: "16px 24px" }}>
                             <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <User size={14} color="var(--text-muted)" />
                                {inv.client.name}
                             </div>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                             {inv.project ? (
                               <Link href={`/projects/${inv.project.id}`} style={{ color: "var(--primary)", textDecoration: "none" }}>
                                 {inv.project.name}
                               </Link>
                             ) : (
                               <span style={{ color: "var(--text-muted)" }}>General</span>
                             )}
                          </td>
                          <td style={{ padding: "16px 24px", color: "var(--text-secondary)" }}>
                             <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Calendar size={14} />
                                {new Date(inv.createdAt).toLocaleDateString()}
                             </div>
                          </td>
                          <td style={{ padding: "16px 24px", textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>
                             ${inv.total.toLocaleString()}
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>
      </section>
    </main>
  )
}
