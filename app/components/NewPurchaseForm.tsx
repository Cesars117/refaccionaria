'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Search, Truck, DollarSign, Package } from 'lucide-react'

interface Item {
  id: number
  name: string
  quantity: number
  costPrice: number
  barcode: string | null
}

interface Supplier {
  id: number
  name: string
}

interface NewPurchaseFormProps {
  suppliers: Supplier[]
  items: Item[]
  createPurchaseOrder: (formData: FormData) => Promise<any>
}

export function NewPurchaseForm({ suppliers, items, createPurchaseOrder }: NewPurchaseFormProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('')
  const [selectedItems, setSelectedItems] = useState<{ itemId: number; quantity: number; name: string; costPrice: number }[]>([])
  const [searchTerm, setSearchTerm] = useState('')
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
      setSelectedItems([...selectedItems, { itemId: item.id, quantity: 1, name: item.name, costPrice: item.costPrice }])
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

  const updatePrice = (itemId: number, price: number) => {
    setSelectedItems(selectedItems.map(si => 
      si.itemId === itemId ? { ...si, costPrice: price } : si
    ))
  }

  const totalPurchase = selectedItems.reduce((acc, curr) => acc + (curr.costPrice * curr.quantity), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplierId) {
      alert('Selecciona un proveedor.')
      return
    }
    if (selectedItems.length === 0) {
      alert('Debes agregar al menos una refacción.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('supplierId', selectedSupplierId.toString())
      formData.append('itemsBought', JSON.stringify(selectedItems))

      await createPurchaseOrder(formData)
      router.push('/purchases')
      router.refresh()
    } catch (error) {
      alert('Error al registrar la compra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "2rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Supplier Selection */}
        <div className="card" style={{ padding: "1.5rem" }}>
           <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
             <Truck size={20} color="var(--primary)" />
             Seleccionar Proveedor
           </h3>
           <select
             required
             value={selectedSupplierId}
             onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
             style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", borderRadius: "8px", color: "var(--text-main)" }}
           >
             <option value="">-- Elige un proveedor --</option>
             {suppliers.map(s => (
               <option key={s.id} value={s.id}>{s.name}</option>
             ))}
           </select>
        </div>

        {/* Item Selection */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={20} color="var(--primary)" />
            Buscar Refacciones para Entrada
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
                {filteredItems.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => addItem(item)}
                    style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Stock Actual: {item.quantity} | Último Costo: ${item.costPrice}</div>
                    </div>
                    <Plus size={18} color="var(--primary)" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: "2rem" }}>
            <h4 style={{ marginBottom: "1rem", color: "var(--text-secondary)", fontSize: "0.875rem", textTransform: "uppercase" }}>Refacciones a Ingresar</h4>
            {selectedItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", border: "2px dashed var(--border-light)", borderRadius: "8px", color: "var(--text-muted)" }}>
                Selecciona refacciones para registrar su entrada.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedItems.map(si => (
                  <div key={si.itemId} style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.25rem", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 700 }}>{si.name}</div>
                      <button type="button" onClick={() => removeItem(si.itemId)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                       <div>
                          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Cantidad que entra</label>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--background)", padding: "4px 8px", borderRadius: "6px" }}>
                            <button type="button" onClick={() => updateQuantity(si.itemId, -1)} style={{ background: "none", border: "none", color: "var(--text-main)", cursor: "pointer" }}>-</button>
                            <input 
                              type="number" 
                              value={si.quantity} 
                              onChange={(e) => updateQuantity(si.itemId, Number(e.target.value) - si.quantity)}
                              style={{ width: "50px", textAlign: "center", background: "none", border: "none", color: "var(--text-main)", fontWeight: 700 }} 
                            />
                            <button type="button" onClick={() => updateQuantity(si.itemId, 1)} style={{ background: "none", border: "none", color: "var(--text-main)", cursor: "pointer" }}>+</button>
                          </div>
                       </div>
                       <div>
                          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Costo Unitario (Compra)</label>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--background)", padding: "4px 8px", borderRadius: "6px" }}>
                            <span style={{ color: "var(--text-secondary)" }}>$</span>
                            <input 
                              type="number" 
                              value={si.costPrice} 
                              onChange={(e) => updatePrice(si.itemId, Number(e.target.value))}
                              style={{ width: "100%", background: "none", border: "none", color: "var(--text-main)", fontWeight: 700, outline: "none" }} 
                            />
                          </div>
                       </div>
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
          <h3 style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "0.75rem" }}>Resumen de Compra</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Refacciones</span>
              <span style={{ fontWeight: 600 }}>{selectedItems.length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: 800, marginTop: "1rem", borderTop: "2px solid var(--border-light)", paddingTop: "1rem", color: "var(--primary)" }}>
              <span>TOTAL</span>
              <span>${totalPurchase.toLocaleString()}</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || selectedItems.length === 0}
            className="btn btn-primary" 
            style={{ width: "100%", padding: "16px", fontSize: "1.125rem", fontWeight: 700, borderRadius: "12px" }}
          >
            {loading ? 'Registrando...' : 'Finalizar Compra'}
          </button>
          
          <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Al finalizar, el inventario se incrementará automáticamente y se actualizarán los precios de costo.
          </p>
        </div>
      </div>
    </form>
  )
}
