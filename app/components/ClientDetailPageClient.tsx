'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Car, Save, Plus, Users, ClipboardList } from 'lucide-react'

interface Vehicle {
  id: number
  model: string
  plate: string | null
}

interface Client {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  vehicles: Vehicle[]
  projects: any[]
}

interface ClientDetailPageClientProps {
  client: Client
  updateClient: (formData: FormData) => Promise<void>
  createVehicle: (formData: FormData) => Promise<void>
}

export function ClientDetailPageClient({ client, updateClient, createVehicle }: ClientDetailPageClientProps) {
  const [loading, setLoading] = useState(false)
  const [showVehicleForm, setShowVehicleForm] = useState(false)

  const handleUpdateClient = async (formData: FormData) => {
    setLoading(true)
    try {
      await updateClient(formData)
      alert('Información del cliente actualizada')
    } catch (error) {
      alert('Error al actualizar cliente')
    } finally {
      setLoading(false)
    }
  }

  const handleAddVehicle = async (formData: FormData) => {
    setLoading(true)
    try {
      await createVehicle(formData)
      setShowVehicleForm(false)
    } catch (error) {
      alert('Error al agregar vehículo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <Link href="/clients" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
        <ArrowLeft size={20} />
        Regresar a Clientes
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Client Info Section */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
             <Users size={24} color="var(--primary)" />
             <h2 className="heading-lg" style={{ margin: 0 }}>Información del Cliente</h2>
          </div>
          
          <form action={handleUpdateClient} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input type="hidden" name="id" value={client.id} />
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>Nombre</label>
              <input name="name" defaultValue={client.name} required style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "6px" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>Teléfono</label>
              <input name="phone" defaultValue={client.phone || ''} style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "6px" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>Email</label>
              <input name="email" defaultValue={client.email || ''} style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "6px" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>Dirección</label>
              <textarea name="address" defaultValue={client.address || ''} rows={3} style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "6px", resize: "none" }} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: "1rem" }}>
              <Save size={18} />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </section>

        {/* Fleet Section */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Car size={24} color="var(--success)" />
                <h2 className="heading-lg" style={{ margin: 0 }}>Flota de Vehículos</h2>
             </div>
             <button onClick={() => setShowVehicleForm(!showVehicleForm)} className="btn btn-secondary">
                <Plus size={18} />
                Agregar
             </button>
          </div>

          {showVehicleForm && (
            <form action={handleAddVehicle} className="card" style={{ marginBottom: "1.5rem", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <input type="hidden" name="clientId" value={client.id} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <input name="model" placeholder="Modelo (Ej. Nissan 300)" required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-light)" }} />
                </div>
                <div>
                  <input name="plate" placeholder="Placas" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-light)" }} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem", width: "100%" }}>Registrar Vehículo</button>
            </form>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {client.vehicles.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                No hay vehículos registrados para este cliente.
              </div>
            ) : (
              client.vehicles.map(vehicle => (
                <div key={vehicle.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "8px", borderRadius: "8px", color: "var(--success)" }}>
                      <Car size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{vehicle.model}</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Placas: {vehicle.plate || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: "2rem" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
                <ClipboardList size={24} color="#a855f7" />
                <h2 className="heading-lg" style={{ margin: 0 }}>Proyectos de este Cliente</h2>
             </div>
             <div className="card" style={{ padding: "1rem" }}>
                {client.projects.length} Proyectos activos
             </div>
          </div>
        </section>
      </div>
    </main>
  )
}
