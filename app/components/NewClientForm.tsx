'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NewClientFormProps {
  createClient: (formData: FormData) => Promise<void>
}

export function NewClientForm({ createClient }: NewClientFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      await createClient(formData)
      router.push('/clients')
    } catch (error) {
      console.error('Error creating client:', error)
      alert('Error al crear el cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="card" style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Nombre del Cliente</label>
        <input
          name="name"
          type="text"
          required
          placeholder="Ej. Transportes del Norte"
          style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Teléfono</label>
          <input
            name="phone"
            type="tel"
            placeholder="Ej. 555-0123"
            style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Correo Electrónico</label>
          <input
            name="email"
            type="email"
            placeholder="Ej. cliente@correo.com"
            style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Dirección (Opcional)</label>
        <textarea
          name="address"
          rows={3}
          placeholder="Dirección completa del cliente..."
          style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none", resize: "vertical" }}
        />
      </div>

      <button 
        type="submit" 
        className="btn btn-primary" 
        disabled={loading}
        style={{ padding: "12px 24px", fontSize: "1rem", fontWeight: 600 }}
      >
        {loading ? 'Registrando...' : 'Registrar Cliente'}
      </button>
    </form>
  )
}
