'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Link2, Package } from 'lucide-react'

interface WipItem {
  id: number
  name: string
  quantity: number
  status: string
  siteKitSku: string | null
  createdAt: string
  location: { name: string }
  serialNumbers: Array<{ id: number; serialNumber: string | null; tmoSerial: string | null }>
}

interface AssetTag {
  id: number
  assetTag: string
  status: string
  linkedItem: { id: number; name: string } | null
}

interface SiteKitItemData {
  id: number
  siteKitSku: string
  description: string
  quantityExpected: number
  quantityReceived: number
  status: string
  assetTags: AssetTag[]
}

interface SiteKitMatchPanelProps {
  siteKitDbId: number
  item: SiteKitItemData
  onClose: () => void
  onMatched: () => void
}

export function SiteKitMatchPanel({ siteKitDbId, item, onClose, onMatched }: SiteKitMatchPanelProps) {
  const [wipItems, setWipItems] = useState<WipItem[]>([])
  const [suggestedItems, setSuggestedItems] = useState<WipItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    loadWipItems()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.siteKitSku])

  const loadWipItems = async () => {
    setLoading(true)
    try {
      // Search WIP items by siteKitSku
      const res = await fetch(`/api/items/search?sku=${encodeURIComponent(item.siteKitSku)}`)
      if (res.ok) {
        const data = await res.json()
        setWipItems(data)
      }

      // Also search by description keywords for suggestions
      const keywords = item.description
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length >= 3)
        .slice(0, 3)
        .join(' ')
      if (keywords) {
        const sugRes = await fetch(`/api/items/search?q=${encodeURIComponent(keywords)}`)
        if (sugRes.ok) {
          const sugData = await sugRes.json()
          setSuggestedItems(sugData)
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const linkSelected = async () => {
    if (selected.size === 0) return
    setLinking(true)
    setError(null)

    try {
      const res = await fetch(`/api/site-kits/${siteKitDbId}/items/${item.id}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: Array.from(selected) }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Match failed')
      }

      onMatched()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link items')
    } finally {
      setLinking(false)
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      AVAILABLE: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
      IN_USE: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
      MAINTENANCE: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
      LOST: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    }
    const style = colors[status] || { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' }
    return (
      <span style={{
        padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem',
        fontWeight: 600, background: style.bg, color: style.color,
      }}>
        {status}
      </span>
    )
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px',
      background: 'var(--bg-primary)', boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
      zIndex: 999, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontWeight: 600 }}>Match WIP Items</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <p><strong>SKU:</strong> {item.siteKitSku}</p>
          <p><strong>Description:</strong> {item.description}</p>
          <p><strong>Expected:</strong> {item.quantityExpected} | <strong>Received:</strong> {item.quantityReceived}</p>
        </div>
        {item.assetTags.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Asset Tags:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {item.assetTags.map((tag) => (
                <span key={tag.id} style={{
                  padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem',
                  background: tag.status === 'RECEIVED' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                  color: tag.status === 'RECEIVED' ? '#10b981' : '#6b7280',
                }}>
                  {tag.assetTag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* WIP Items list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '0.5rem' }}>Loading WIP items...</p>
          </div>
        ) : (
          <>
            {/* Exact SKU matches */}
            {wipItems.length > 0 && (
              <>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  SKU Matches ({wipItems.length})
                </p>
                {wipItems.map((wip) => (
                  <div
                    key={wip.id}
                    onClick={() => toggleSelect(wip.id)}
                    style={{
                      padding: '0.75rem',
                      border: `2px solid ${selected.has(wip.id) ? 'var(--primary)' : 'var(--border-light)'}`,
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      background: selected.has(wip.id) ? 'rgba(99,102,241,0.08)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{wip.name}</span>
                      {statusBadge(wip.status)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      <span>Qty: {wip.quantity}</span> · <span>{wip.location.name}</span> · <span>{new Date(wip.createdAt).toLocaleDateString()}</span>
                    </div>
                    {wip.siteKitSku && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                        SKU: {wip.siteKitSku}
                      </div>
                    )}
                    {wip.serialNumbers.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        S/N: {wip.serialNumbers.map((sn) => sn.tmoSerial || sn.serialNumber).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* No SKU matches — show empty state */}
            {wipItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                <Package size={32} style={{ margin: '0 auto', opacity: 0.5 }} />
                <p style={{ marginTop: '0.5rem', fontSize: '0.813rem' }}>No items with exact SKU</p>
              </div>
            )}

            {/* Suggested matches by description */}
            {suggestedItems.length > 0 && (() => {
              const skuIds = new Set(wipItems.map(w => w.id))
              const filtered = suggestedItems.filter(s => !skuIds.has(s.id))
              if (filtered.length === 0) return null
              return (
                <>
                  <div style={{ marginTop: wipItems.length > 0 ? '1rem' : '0' }}>
                    <button
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      style={{
                        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                        borderRadius: '8px', padding: '8px 12px', width: '100%', cursor: 'pointer',
                        fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      }}
                    >
                      <Package size={14} />
                      {showSuggestions ? 'Hide' : 'Show'} {filtered.length} possible{filtered.length !== 1 ? 's' : ''} name match{filtered.length !== 1 ? 'es' : ''}
                    </button>
                  </div>
                  {showSuggestions && (
                    <div style={{ marginTop: '0.5rem' }}>
                      {filtered.map((wip) => (
                        <div
                          key={wip.id}
                          onClick={() => toggleSelect(wip.id)}
                          style={{
                            padding: '0.75rem',
                            border: `2px solid ${selected.has(wip.id) ? 'var(--primary)' : 'rgba(245,158,11,0.3)'}`,
                            borderRadius: '8px',
                            marginBottom: '0.5rem',
                            cursor: 'pointer',
                            background: selected.has(wip.id) ? 'rgba(99,102,241,0.08)' : 'rgba(245,158,11,0.04)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{wip.name}</span>
                            {statusBadge(wip.status)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            <span>Qty: {wip.quantity}</span> · <span>{wip.location.name}</span> · <span>{new Date(wip.createdAt).toLocaleDateString()}</span>
                          </div>
                          {wip.siteKitSku && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                              SKU: {wip.siteKitSku}
                            </div>
                          )}
                          {wip.serialNumbers.length > 0 && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              S/N: {wip.serialNumbers.map((sn) => sn.tmoSerial || sn.serialNumber).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}

            {/* No matches at all */}
            {wipItems.length === 0 && suggestedItems.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                No possible name matches found
              </p>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-light)' }}>
        {error && (
          <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{error}</p>
        )}
        <button
          onClick={linkSelected}
          disabled={selected.size === 0 || linking}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          {linking ? (
            <><Loader2 size={16} className="animate-spin" style={{ marginRight: '0.5rem' }} /> Linking...</>
          ) : (
            <><Link2 size={16} style={{ marginRight: '0.5rem' }} /> Link {selected.size} Selected</>
          )}
        </button>
      </div>
    </div>
  )
}
