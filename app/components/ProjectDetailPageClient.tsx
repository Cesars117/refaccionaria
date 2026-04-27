'use client'

import Link from 'next/link'
import { generateInvoicePDF } from '@/app/lib/invoice-pdf'
import { ArrowLeft, Plus, ClipboardList, Car, User, DollarSign, Package, Calendar, FileText } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'

interface ProjectDetailPageClientProps {
  project: any
}

export function ProjectDetailPageClient({ project }: ProjectDetailPageClientProps) {
  const { t } = useLanguage()

  const handleDownloadPDF = (so: any) => {
    generateInvoicePDF(so, project.client, project.vehicle)
  }

  const totalSpent = project.serviceOrders.reduce((acc: number, so: any) => acc + so.totalAmount, 0)


  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <Link href="/projects" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
        <ArrowLeft size={20} />
        Regresar a Proyectos
      </Link>

      {/* Project Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "0.5rem" }}>
             <span style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--success)", fontSize: "0.75rem", fontWeight: 700, padding: "4px 12px", borderRadius: "20px" }}>
                {project.status}
             </span>
             <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>ID: PROJ-{project.id}</span>
          </div>
          <h1 className="heading-xl">{project.name}</h1>
          <div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <User size={18} color="var(--primary)" />
                <strong>Cliente:</strong> {project.client.name}
             </div>
             {project.vehicle && (
               <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                  <Car size={18} color="var(--success)" />
                  <strong>Unidad:</strong> {project.vehicle.model} ({project.vehicle.plate || 'Sin Placas'})
               </div>
             )}
          </div>
        </div>
        <div className="card" style={{ padding: "1.5rem", background: "var(--primary)", color: "white", textAlign: "right" }}>
           <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>Total Invertido</div>
           <div style={{ fontSize: "2rem", fontWeight: 800 }}>${totalSpent.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
        {/* Service Orders History */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 className="heading-lg" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ClipboardList size={24} color="#a855f7" />
              Historial de Órdenes de Servicio
            </h2>
            <Link href={`/projects/${project.id}/service-orders/new`} className="btn btn-primary">
              <Plus size={20} />
              Registrar Salida / Venta
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {project.serviceOrders.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
                 <ClipboardList size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
                 <p>No se han registrado órdenes de servicio para este proyecto aún.</p>
              </div>
            ) : (
              project.serviceOrders.map((so: any) => (
                <div key={so.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                   <div style={{ padding: "1.25rem 1.5rem", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: "1.125rem" }}>Orden: {so.orderNumber}</span>
                        <span style={{ marginLeft: "1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                          <Calendar size={14} style={{ display: "inline", marginRight: "4px", verticalAlign: "text-bottom" }} />
                          {new Date(so.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <button 
                          onClick={() => handleDownloadPDF(so)}
                          className="btn"
                          style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", padding: "8px 16px", fontSize: "0.875rem" }}
                        >
                          <FileText size={18} />
                          Descargar Factura
                        </button>
                        <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: "1.25rem" }}>
                          ${so.totalAmount.toLocaleString()}
                        </div>
                      </div>
                   </div>
                   <div style={{ padding: "1.5rem" }}>
                      <h4 style={{ fontSize: "0.875rem", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "1rem", letterSpacing: "0.05em" }}>Detalle de Refacciones</h4>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                         <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-light)", textAlign: "left", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                               <th style={{ padding: "8px 0" }}>REFACCIÓN</th>
                               <th style={{ padding: "8px 0", textAlign: "center" }}>CANTIDAD</th>
                               <th style={{ padding: "8px 0", textAlign: "right" }}>PRECIO U.</th>
                               <th style={{ padding: "8px 0", textAlign: "right" }}>SUBTOTAL</th>
                            </tr>
                         </thead>
                         <tbody>
                            {so.itemsUsed.map((si: any) => (
                              <tr key={si.id} style={{ borderBottom: "1px solid var(--border-light)", fontSize: "0.875rem" }}>
                                 <td style={{ padding: "12px 0" }}>
                                    <div style={{ fontWeight: 600 }}>{si.item.name}</div>
                                 </td>
                                 <td style={{ padding: "12px 0", textAlign: "center" }}>{si.quantity}</td>
                                 <td style={{ padding: "12px 0", textAlign: "right" }}>${si.unitPrice.toLocaleString()}</td>
                                 <td style={{ padding: "12px 0", textAlign: "right", fontWeight: 600 }}>${(si.quantity * si.unitPrice).toLocaleString()}</td>
                              </tr>
                            ))}

                         </tbody>
                      </table>
                   </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
