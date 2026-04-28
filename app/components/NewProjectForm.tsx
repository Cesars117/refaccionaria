'use client'

import { useState, useEffect } from 'react'

interface Vehicle {
  id: number
  model: string
  plate: string | null
}

interface Client {
  id: number
  name: string
  vehicles: Vehicle[]
}

interface NewProjectFormProps {
  clients: any[]

  createProject: (formData: FormData) => Promise<void>
}

export function NewProjectForm({ clients, createProject }: NewProjectFormProps) {
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('')
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedClientId !== '') {
      const client = clients.find(c => c.id === selectedClientId)
      setAvailableVehicles(client?.vehicles || [])
    } else {
      setAvailableVehicles([])
    }
  }, [selectedClientId, clients])

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      await createProject(formData)
    } catch (error) {
      alert('Error al crear el proyecto')
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="card" style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Nombre del Proyecto / Contrato</label>
        <input
          name="name"
          type="text"
          required
          placeholder="Ej. Mantenimiento Frenos - Nissan 300"
          style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Cliente</label>
        <select
          name="clientId"
          required
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(Number(e.target.value))}
          style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}
        >
          <option value="">Selecciona un cliente</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Vehículo de la Flota (Opcional)</label>
        <select
          name="vehicleId"
          disabled={!selectedClientId}
          style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none", opacity: selectedClientId ? 1 : 0.5 }}
        >
          <option value="">Selecciona un vehículo</option>
          {availableVehicles.map(vehicle => (
            <option key={vehicle.id} value={vehicle.id}>{vehicle.model} ({vehicle.plate || 'No Placas'})</option>
          ))}
        </select>
        {!selectedClientId && <p style={{ fontSize: "0.75rem", color: "var(--warning)", marginTop: "4px" }}>Selecciona un cliente primero para ver sus vehículos.</p>}
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Estado Inicial</label>
        <select
          name="status"
          defaultValue="ACTIVE"
          style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}
        >
          <option value="ACTIVE">Activo (En curso)</option>
          <option value="ON_HOLD">En Pausa</option>
          <option value="COMPLETED">Completado</option>
        </select>
      </div>

      <button 
        type="submit" 
        className="btn btn-primary" 
        disabled={loading}
        style={{ padding: "12px 24px", fontSize: "1rem", fontWeight: 600 }}
      >
        {loading ? 'Iniciando Proyecto...' : 'Iniciar Proyecto'}
      </button>
    </form>
  )
}
