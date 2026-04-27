'use client'

import { useState } from 'react'
import { Plus, Trash2, X, Loader2, FileText, Copy } from 'lucide-react'

interface BOMItem {
  siteKitSku: string
  quantity: number
  description: string
  assetTags: string
}

interface BOMManualEntryProps {
  existingSiteKitId?: number
  onImportComplete: () => void
  onClose: () => void
}

const EMPTY_ITEM: BOMItem = { siteKitSku: '', quantity: 1, description: '', assetTags: '' }

export function BOMManualEntry({ existingSiteKitId, onImportComplete, onClose }: BOMManualEntryProps) {
  const [header, setHeader] = useState({
    siteKitId: '', bomId: '', siteId: '', projectName: '',
    pallets: '', authNumber: '', dateCompleted: '', mslLocation: '',
    company: '', catsCode: '', subcontractor: '',
  })
  const [items, setItems] = useState<BOMItem[]>([{ ...EMPTY_ITEM }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bulkText, setBulkText] = useState('')
  const [showBulkPaste, setShowBulkPaste] = useState(false)

  const updateHeader = (key: string, value: string) => {
    setHeader(prev => ({ ...prev, [key]: value }))
  }

  const updateItem = (idx: number, field: keyof BOMItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const addItem = () => {
    setItems(prev => [...prev, { ...EMPTY_ITEM }])
  }

  const removeItem = (idx: number) => {
    setItems(prev => {
      const filtered = prev.filter((_, i) => i !== idx)
      return filtered.length === 0 ? [{ ...EMPTY_ITEM }] : filtered
    })
  }

  const duplicateItem = (idx: number) => {
    setItems(prev => {
      const copy = { ...prev[idx], assetTags: '' }
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]
    })
  }

  // Parse bulk paste: extracts SKU (number), Qty (number), Description, and Asset Tags (TM-prefixed)
  const handleBulkPaste = () => {
    if (!bulkText.trim()) return
    const lines = bulkText.trim().split('\n')
    const parsed: BOMItem[] = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      let sku = ''
      let qty = 1
      let description = ''
      let assetTags = ''

      if (trimmed.includes('\t')) {
        // Tab-separated: SKU \t Qty \t Description \t AssetTags
        const parts = trimmed.split('\t')
        sku = parts[0]?.trim() || ''
        qty = parseInt(parts[1]?.trim()) || 1
        const rest = parts.slice(2).join('\t').trim()
        const restParts = rest.split(',')
        const descParts: string[] = []
        const tagParts: string[] = []
        for (const p of restParts) {
          if (p.trim().match(/^TM\d/i)) {
            tagParts.push(p.trim())
          } else {
            descParts.push(p.trim())
          }
        }
        description = descParts.join(', ')
        assetTags = tagParts.join(', ')
      } else {
        // Comma or space separated — use regex to extract SKU and Qty from the start
        const match = trimmed.match(/^(\d+)[,\s]+\s*(\d+)[,\s]+\s*(.*)$/)
        if (match) {
          sku = match[1]
          qty = parseInt(match[2]) || 1
          const rest = match[3]
          // Separate description from TM asset tags
          const restParts = rest.split(',')
          const descParts: string[] = []
          const tagParts: string[] = []
          for (const p of restParts) {
            if (p.trim().match(/^TM\d/i)) {
              tagParts.push(p.trim())
            } else {
              descParts.push(p.trim())
            }
          }
          description = descParts.join(', ').replace(/,\s*$/, '')
          assetTags = tagParts.join(', ')
        } else {
          // Fallback: treat entire line as description
          sku = ''
          description = trimmed
        }
      }

      if (sku || description) {
        parsed.push({ siteKitSku: sku, quantity: qty, description, assetTags })
      }
    }
    if (parsed.length > 0) {
      setItems(prev => {
        const nonEmpty = prev.filter(i => i.siteKitSku || i.description)
        return [...nonEmpty, ...parsed]
      })
      setBulkText('')
      setShowBulkPaste(false)
    }
  }

  const handleSave = async () => {
    const validItems = items.filter(i => i.siteKitSku.trim())
    if (!existingSiteKitId && !header.siteKitId.trim()) {
      setError('Site Kit ID is required')
      return
    }
    if (validItems.length === 0) {
      setError('Add at least one item with SKU')
      return
    }

    setSaving(true)
    setError(null)

    // Convert asset tag strings to arrays
    const formattedItems = validItems.map(i => ({
      siteKitSku: i.siteKitSku.trim(),
      quantity: i.quantity,
      description: i.description.trim(),
      assetTags: i.assetTags
        ? i.assetTags.split(/[,\s]+/).map(t => t.trim()).filter(t => t.startsWith('TM'))
        : [],
    }))

    try {
      if (existingSiteKitId) {
        const res = await fetch(`/api/site-kits/${existingSiteKitId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: formattedItems }),
        })
        if (!res.ok) throw new Error('Error adding items')
      } else {
        const payload = {
          ...header,
          pallets: header.pallets ? parseInt(header.pallets) : null,
          items: formattedItems,
        }
        const res = await fetch('/api/site-kits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          let msg = 'Error creating Site Kit'
          try { const d = await res.json(); msg = d.error || msg } catch { /* ignore */ }
          throw new Error(msg)
        }
      }
      onImportComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving data')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', fontSize: '0.813rem' }
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '2px', display: 'block' }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
    }}>
      <div className="card" style={{
        maxWidth: '1100px', width: '100%', maxHeight: '92vh', overflow: 'auto', padding: '2rem',
      }}>
        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <h2 className="heading-lg" style={{ margin: 0 }}>
                {existingSiteKitId ? 'Add Items to Site Kit' : 'Manual BOM Entry'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Tellworks format — enter data from the BOM document
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn" style={{ background: 'transparent', padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Header Fields (only if creating new) */}
        {!existingSiteKitId && (
          <div style={{
            background: 'var(--surface-secondary)', borderRadius: '12px', padding: '1.25rem',
            marginBottom: '1.5rem', border: '1px solid var(--border-light)',
          }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              BOM Header
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {[
                { label: 'Site Kit ID *', key: 'siteKitId', placeholder: 'SITEKIT_XXXXX' },
                { label: 'BOM ID', key: 'bomId', placeholder: '455910' },
                { label: 'Site ID', key: 'siteId', placeholder: 'HNYVH0Q4' },
                { label: 'Project', key: 'projectName', placeholder: 'VENUE ACS' },
                { label: 'Pallets', key: 'pallets', placeholder: '0' },
                { label: 'Auth #', key: 'authNumber', placeholder: '1851203' },
                { label: 'Date Completed', key: 'dateCompleted', placeholder: '1/28/2025' },
                { label: 'MSL Location', key: 'mslLocation', placeholder: 'Tellworks Houston' },
                { label: 'Company', key: 'company', placeholder: 'ENERTECH' },
                { label: 'CATS Code', key: 'catsCode', placeholder: 'HNTCON043' },
                { label: 'Subcontractor', key: 'subcontractor', placeholder: '' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    className="input"
                    style={inputStyle}
                    placeholder={placeholder}
                    value={header[key as keyof typeof header]}
                    onChange={(e) => updateHeader(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items Table */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
              BOM Items ({items.filter(i => i.siteKitSku.trim()).length} items)
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowBulkPaste(!showBulkPaste)}
                className="btn"
                style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}
              >
                <Copy size={14} /> Paste from table
              </button>
              <button onClick={addItem} className="btn" style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                <Plus size={14} /> Add row
              </button>
            </div>
          </div>

          {/* Bulk Paste Area */}
          {showBulkPaste && (
            <div style={{
              background: 'var(--surface-secondary)', borderRadius: '8px', padding: '1rem',
              marginBottom: '1rem', border: '1px solid var(--border-light)',
            }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Paste rows from Excel or text. Line format: <strong>SKU, Quantity, Description, AssetTags...</strong>
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`32683, 43, FTSF Sync Cable F\n33143, 4, Delta 10A Breaker, TM10607099, TM10600507\n34097 9 IXR-E Router Gen 2, TM10604714, TM10600510\n33192, 1, Indoor Equipment Rack`}
                style={{
                  width: '100%', minHeight: '100px', fontFamily: 'monospace', fontSize: '0.75rem',
                  padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-light)',
                  background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button onClick={handleBulkPaste} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '6px 16px' }}>
                  Import rows
                </button>
                <button onClick={() => setShowBulkPaste(false)} className="btn" style={{ fontSize: '0.75rem', padding: '6px 16px', background: 'var(--surface-secondary)' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Items rows */}
          <div style={{ border: '1px solid var(--border-light)', borderRadius: '10px', overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '100px 70px 1fr 1fr 70px',
              gap: '0', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-light)',
              padding: '8px 12px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)',
            }}>
              <span>SKU</span>
              <span>Qty.</span>
              <span>Description</span>
              <span>Asset Tags (comma-separated)</span>
              <span></span>
            </div>

            {items.map((item, idx) => (
              <div key={idx} style={{
                display: 'grid', gridTemplateColumns: '100px 70px 1fr 1fr 70px',
                gap: '6px', padding: '8px 12px', alignItems: 'start',
                borderBottom: idx < items.length - 1 ? '1px solid var(--border-light)' : 'none',
                background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
              }}>
                <input
                  className="input"
                  style={{ fontSize: '0.813rem', padding: '6px 8px', fontFamily: 'monospace' }}
                  placeholder="32683"
                  value={item.siteKitSku}
                  onChange={(e) => updateItem(idx, 'siteKitSku', e.target.value)}
                />
                <input
                  className="input"
                  type="number"
                  min={1}
                  style={{ fontSize: '0.813rem', padding: '6px 8px', textAlign: 'center' }}
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                />
                <input
                  className="input"
                  style={{ fontSize: '0.813rem', padding: '6px 8px' }}
                  placeholder="FTSF Sync Cable F"
                  value={item.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                />
                <input
                  className="input"
                  style={{ fontSize: '0.75rem', padding: '6px 8px', fontFamily: 'monospace' }}
                  placeholder="TM10607099, TM10600507..."
                  value={item.assetTags}
                  onChange={(e) => updateItem(idx, 'assetTags', e.target.value)}
                />
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button
                    onClick={() => duplicateItem(idx)}
                    title="Duplicate row"
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'var(--text-secondary)', padding: '4px',
                    }}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => removeItem(idx)}
                    title="Delete row"
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: '#ef4444', padding: '4px',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            color: '#ef4444', padding: '0.75rem', background: 'rgba(239,68,68,0.1)',
            borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn" style={{ background: 'var(--surface-secondary)', padding: '10px 24px' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '10px 32px' }}
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : `Save BOM (${items.filter(i => i.siteKitSku.trim()).length} items)`}
          </button>
        </div>
      </div>
    </div>
  )
}
