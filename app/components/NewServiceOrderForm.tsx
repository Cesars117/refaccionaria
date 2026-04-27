'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Search, Package, DollarSign } from 'lucide-react'

interface Item {
  id: number
  name: string
  quantity: number
  salePrice: number
  barcode: string | null
}

interface NewServiceOrderFormProps {
  project: any
  items: Item[]
  createServiceOrder: (formData: FormData) => Promise<any>
}

export function NewServiceOrderForm({ project, items, createServiceOrder }: NewServiceOrderFormProps) {
  const [selectedItems, setSelectedItems] = useState<{ itemId: number; quantity: number; name: string; price: number }[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [laborCost, setLaborCost] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.barcode && item.barcode.includes(searchTerm))
  ).slice(0, 5)

  const addItem = (item: Item) => {
    const existing = selectedItems.find(si => si.itemId === item.id)
    if (existing) {
      setSelectedItems(selectedItems.map(si => 
        si.itemId === item.id ? { ...si, quantity: si.quantity + 1 } : si
      ))
    } else {
      setSelectedItems([...selectedItems, { itemId: item.id, quantity: 1, name: item.name, price: item.salePrice }])
    }
    setSearchTerm('')
  }

  const removeItem = (itemId: number) => {
    setSelectedItems(selectedItems.filter(si => si.itemId !== itemId))
  }

  const updateQuantity = (itemId: number, delta: number) => {
    setSelectedItems(selectedItems.map(si => {
      if (si.itemId === itemId) {
        const newQty = Math.max(1, si.quantity + delta)
        return { ...si, quantity: newQty }
      }
      return si
    }))
  }

  const totalParts = selectedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)
  const grandTotal = totalParts + laborCost

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedItems.length === 0 && laborCost === 0) {
      alert('Debes agregar al menos una refacción o costo de mano de obra.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('projectId', project.id.toString())
      formData.append('laborCost', laborCost.toString())
      formData.append('type', 'GENERAL')
      formData.append('itemsUsed', JSON.stringify(selectedItems))

      await createServiceOrder(formData)
      router.push(`/projects/${project.id}`)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al crear orden de servicio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "2rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Item Selection */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={20} color="var(--primary)" />
            Buscar Refacciones
          </h3>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Nombre o Código de Barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-light)", background: "var(--bg-elevated)", outline: "none" }}
            />
            {searchTerm && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-elevated)", border: "1px solid var(--border-light)", borderRadius: "0 0 8px 8px", zIndex: 10, boxShadow: "var(--shadow-lg)" }}>
                {filteredItems.length === 0 ? (
                  <div style={{ padding: "12px", color: "var(--text-secondary)" }}>No se encontraron refacciones</div>
                ) : (
                  filteredItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => addItem(item)}
                      style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      onMouseOver={(e) => e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)"}
                      onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Stock: {item.quantity} | Precio: ${item.salePrice}</div>
                      </div>
                      <Plus size={18} color="var(--primary)" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: "2rem" }}>
            <h4 style={{ marginBottom: "1rem", color: "var(--text-secondary)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Refacciones Agregadas</h4>
            {selectedItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", border: "2px dashed var(--border-light)", borderRadius: "8px", color: "var(--text-muted)" }}>
                Busca y selecciona refacciones para agregarlas a la orden.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedItems.map(si => (
                  <div key={si.itemId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{si.name}</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>${si.price} c/u</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--background)", padding: "4px 8px", borderRadius: "6px" }}>
                        <button type="button" onClick={() => updateQuantity(si.itemId, -1)} style={{ background: "none", border: "none", color: "var(--text-main)", cursor: "pointer" }}>-</button>
                        <span style={{ fontWeight: 600, minWidth: "20px", textAlign: "center" }}>{si.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(si.itemId, 1)} style={{ background: "none", border: "none", color: "var(--text-main)", cursor: "pointer" }}>+</button>
                      </div>
                      <div style={{ fontWeight: 700, minWidth: "80px", textAlign: "right" }}>${(si.price * si.quantity).toLocaleString()}</div>
                      <button type="button" onClick={() => removeItem(si.itemId)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


      </div>

      {/* Summary Sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem", position: "sticky", top: "2rem" }}>
          <h3 style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "0.75rem" }}>Resumen de Orden</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Refacciones ({selectedItems.length})</span>
              <span style={{ fontWeight: 600 }}>${totalParts.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: 800, marginTop: "1rem", borderTop: "2px solid var(--border-light)", paddingTop: "1rem", color: "var(--primary)" }}>
              <span>TOTAL</span>
              <span>${grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || (selectedItems.length === 0 && laborCost === 0)}
            className="btn btn-primary" 
            style={{ width: "100%", padding: "16px", fontSize: "1.125rem", fontWeight: 700, borderRadius: "12px" }}
          >
            {loading ? 'Procesando...' : 'Finalizar Orden'}
          </button>
          
          <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Al finalizar, el inventario se descontará automáticamente y se generará una factura interna.
          </p>
        </div>
      </div>
    </form>
  )
}
