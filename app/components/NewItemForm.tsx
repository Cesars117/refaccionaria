'use client'

import { useState } from 'react'
import { ScanButton } from './ScanButton'
import { BarcodeGeneratorButton } from './BarcodeGeneratorButton'
import { Plus, Trash2 } from 'lucide-react'

interface NewItemFormProps {
  categories: Array<{ id: number; name: string }>
  locations: Array<{ id: number; name: string }>
  createItem: (formData: FormData) => Promise<void>
  preloadedBarcode?: string | null
}

interface SerialEntry {
  serialNumber: string
  tmoSerial: string
}

export function NewItemForm({ categories, locations, createItem, preloadedBarcode }: NewItemFormProps) {
  const [barcode, setBarcode] = useState(preloadedBarcode || '')
  const [unitType, setUnitType] = useState('units')
  const [categoryId, setCategoryId] = useState('')
  const [serialEntries, setSerialEntries] = useState<SerialEntry[]>([])

  const handleBarcodeSet = (newBarcode: string) => {
    setBarcode(newBarcode)
  }

  const selectedCategory = categories.find(cat => cat.id.toString() === categoryId)
  const isMaterial = selectedCategory?.name === 'Material'

  const addSerialEntry = () => {
    setSerialEntries([...serialEntries, { serialNumber: '', tmoSerial: '' }])
  }

  const removeSerialEntry = (index: number) => {
    setSerialEntries(serialEntries.filter((_, i) => i !== index))
  }

  const updateSerialEntry = (index: number, field: keyof SerialEntry, value: string) => {
    const updated = [...serialEntries]
    updated[index] = { ...updated[index], [field]: value }
    setSerialEntries(updated)
  }

  const handleSubmit = async (formData: FormData) => {
    // Inject serial numbers as JSON into the form data
    const validSerials = serialEntries.filter(s => s.serialNumber.trim() || s.tmoSerial.trim())
    if (validSerials.length > 0) {
      formData.set('serialNumbers', JSON.stringify(validSerials))
    }
    await createItem(formData)
  }

  return (
    <form action={handleSubmit} className="card" style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div id="error-message" style={{ display: "none", padding: "12px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#dc2626", borderRadius: "var(--radius-sm)" }}></div>

      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Item Name</label>
        <input
          name="name"
          type="text"
          required
          placeholder="e.g. 20V Hammer Drill"
          style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Barcode</label>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          <input
            name="barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            type="text"
            placeholder="Scan or enter barcode"
            style={{ 
              flex: 1, 
              minWidth: "200px",
              padding: "12px", 
              background: "var(--bg-elevated)", 
              border: "1px solid var(--border-light)", 
              color: "var(--text-main)", 
              borderRadius: "var(--radius-sm)", 
              outline: "none" 
            }}
          />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <ScanButton onScan={handleBarcodeSet} />
            <BarcodeGeneratorButton onBarcodeGenerated={handleBarcodeSet} />
          </div>
        </div>
        <small style={{ color: "var(--text-secondary)", fontSize: "0.875rem", display: "block", marginTop: "0.5rem" }}>
          Optional - Must be unique. Use &quot;📷 Scan&quot; to use camera or &quot;Generate&quot; to create one automatically.
        </small>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Category</label>
          <select 
            name="categoryId" 
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required 
            style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}
          >
            <option value="" disabled>Select a category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Location</label>
          <select name="locationId" required style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}>
            <option value="" disabled selected>Select a location</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Quantity</label>
          <input name="quantity" type="number" min="1" defaultValue="1" required style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Status</label>
          <select name="status" defaultValue="AVAILABLE" required style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}>
            <option value="AVAILABLE">Available</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Cost Price ($)</label>
          <input name="costPrice" type="number" step="0.01" defaultValue="0.00" required style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Sale Price ($)</label>
          <input name="salePrice" type="number" step="0.01" defaultValue="0.00" required style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }} />
        </div>
      </div>


      {isMaterial && (
        <>
          <div style={{ padding: "16px", background: "rgba(99, 102, 241, 0.05)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "var(--primary)", fontSize: "0.875rem", fontWeight: 600 }}>Material Configuration</h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Unit Type</label>
                <select 
                  name="unitType" 
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }}
                >
                  <option value="units">Units</option>
                  <option value="boxes">Boxes</option>
                </select>
              </div>

              {unitType === 'boxes' && (
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Units per Box</label>
                  <input name="unitsPerBox" type="number" min="1" defaultValue="1" style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none" }} />
                </div>
              )}
            </div>

            <small style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              {unitType === 'boxes' 
                ? 'Total units are calculated automatically: Quantity × Units per Box'
                : 'Will be registered directly as individual units'
              }
            </small>
          </div>
        </>
      )}

      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>Description (Optional)</label>
        <textarea name="description" rows={3} placeholder="Additional information about this item..." style={{ width: "100%", padding: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none", resize: "vertical", minHeight: "80px" }}></textarea>
      </div>



      {/* Serial Numbers Section */}
      <div style={{ padding: "16px", background: "rgba(99, 102, 241, 0.05)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h4 style={{ margin: 0, color: "var(--primary)", fontSize: "0.875rem", fontWeight: 600 }}>
            🔢 Serial Numbers (Optional)
          </h4>
          <button
            type="button"
            onClick={addSerialEntry}
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              padding: "6px 12px", background: "var(--primary)", color: "white",
              border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 500
            }}
          >
            <Plus size={14} /> Add Serial
          </button>
        </div>

        {serialEntries.length === 0 && (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
            No serial numbers yet. Click &quot;Add Serial&quot; to add one or more.
          </p>
        )}

        {serialEntries.map((entry, index) => (
          <div key={index} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "8px" }}>
            <div style={{ flex: 1 }}>
              {index === 0 && <label style={{ display: "block", marginBottom: "4px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 500 }}>Serial Number</label>}
              <input
                type="text"
                value={entry.serialNumber}
                onChange={(e) => updateSerialEntry(index, 'serialNumber', e.target.value)}
                placeholder="Serial Number"
                style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--border-light)", color: "var(--text-main)", borderRadius: "var(--radius-sm)", outline: "none", fontSize: "0.875rem" }}
              />
            </div>

            <button
              type="button"
              onClick={() => removeSerialEntry(index)}
              style={{
                padding: "10px", background: "rgba(239, 68, 68, 0.1)", color: "#dc2626",
                border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer",
                marginTop: index === 0 ? "20px" : "0", flexShrink: 0
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {serialEntries.length > 0 && (
          <small style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
            {serialEntries.filter(s => s.serialNumber.trim() || s.tmoSerial.trim()).length} of {serialEntries.length} with data. Both fields are optional per entry.
          </small>
        )}
      </div>

      <button type="submit" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "1rem", fontWeight: 600 }}>
        Create Item
      </button>
    </form>
  )
}