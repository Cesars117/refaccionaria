'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertCircle, TrendingUp, Trash2, Pencil, Plus, Save, X, Search } from 'lucide-react'
import { SiteKitMatchPanel } from '@/app/components/SiteKitMatchPanel'
import { SiteKitReportButton } from '@/app/components/SiteKitReportButton'
import { BOMManualEntry } from '@/app/components/BOMManualEntry'

interface AssetTag {
  id: number
  assetTag: string
  status: string
  linkedItem: { id: number; name: string; status: string; quantity: number } | null
  linkedSerial: { id: number; serialNumber: string | null; tmoSerial: string | null } | null
}

interface SiteKitItemData {
  id: number
  siteKitSku: string
  description: string
  quantityExpected: number
  quantityReceived: number
  status: string
  notes: string | null
  assetTags: AssetTag[]
}

interface SiteKitData {
  id: number
  siteKitId: string
  bomId: string | null
  siteId: string | null
  projectName: string | null
  pallets: number | null
  authNumber: string | null
  mslLocation: string | null
  company: string | null
  catsCode: string | null
  subcontractor: string | null
  dateCompleted: string | null
  status: string
  createdAt: string
  items: SiteKitItemData[]
}

export default function SiteKitDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<SiteKitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [matchingItem, setMatchingItem] = useState<SiteKitItemData | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ siteKitSku: '', description: '', quantityExpected: 0 })
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/site-kits/${id}`)
      if (res.ok) setData(await res.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const startEdit = (item: SiteKitItemData) => {
    setEditingItemId(item.id)
    setEditForm({ siteKitSku: item.siteKitSku, description: item.description, quantityExpected: item.quantityExpected })
  }

  const cancelEdit = () => {
    setEditingItemId(null)
    setEditForm({ siteKitSku: '', description: '', quantityExpected: 0 })
  }

  const saveEdit = async (itemId: number) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/site-kits/${id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setEditingItemId(null)
        loadData()
      }
    } catch { /* ignore */ } finally {
      setActionLoading(false)
    }
  }

  const deleteItem = async (itemId: number) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/site-kits/${id}/items/${itemId}`, { method: 'DELETE' })
      if (res.ok) {
        setDeletingItemId(null)
        loadData()
      }
    } catch { /* ignore */ } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: '4rem auto' }} />
      </main>
    )
  }

  if (!data) {
    return (
      <main className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <p>Site Kit not found</p>
        <Link href="/site-kits" style={{ color: 'var(--primary)' }}>Back to list</Link>
      </main>
    )
  }

  const totalExpected = data.items.reduce((s, i) => s + i.quantityExpected, 0)
  const totalReceived = data.items.reduce((s, i) => s + i.quantityReceived, 0)
  const totalMissing = Math.max(totalExpected - totalReceived, 0)
  const totalSurplus = data.items.filter((i) => i.status === 'SURPLUS').reduce((s, i) => s + (i.quantityReceived - i.quantityExpected), 0)
  const verified = data.items.filter((i) => i.status === 'VERIFIED').length
  const progressPct = data.items.length > 0 ? Math.round((verified / data.items.length) * 100) : 0

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      PENDING: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
      VERIFIED: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
      MISSING: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
      SURPLUS: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
      PARTIAL: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
      IN_PROGRESS: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
      COMPLETE: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
      DISCREPANCY: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    }
    const s = map[status] || map.PENDING
    return (
      <span style={{
        padding: '3px 10px', borderRadius: '9999px', fontSize: '0.7rem',
        fontWeight: 600, background: s.bg, color: s.color,
      }}>
        {status}
      </span>
    )
  }

  return (
    <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/site-kits" style={{ color: 'var(--text-secondary)' }}><ArrowLeft size={20} /></Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 className="heading-xl">{data.siteKitId}</h1>
              {statusBadge(data.status)}
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              {data.projectName || 'No project'} · Site: {data.siteId || 'N/A'} · BOM: {data.bomId || 'N/A'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={() => setShowManualEntry(true)} className="btn" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <Plus size={16} /> Add Items
          </button>
          <SiteKitReportButton siteKitDbId={data.id} status={data.status} />
        </div>
      </header>

      {/* Metadata */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
          {[
            { label: 'Auth #', value: data.authNumber },
            { label: 'Pallets', value: data.pallets },
            { label: 'MSL Location', value: data.mslLocation },
            { label: 'Company', value: data.company },
            { label: 'CATS Code', value: data.catsCode },
            { label: 'Subcontractor', value: data.subcontractor },
            { label: 'Date Completed', value: data.dateCompleted ? new Date(data.dateCompleted).toLocaleDateString() : null },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{label}</p>
              <p style={{ fontWeight: 500 }}>{value ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>{verified} of {data.items.length} items verified ({progressPct}%)</span>
        </div>
        <div style={{ width: '100%', height: '10px', background: 'var(--border-light)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{
            width: `${progressPct}%`, height: '100%', borderRadius: '5px',
            background: progressPct === 100 ? '#10b981' : '#3b82f6',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Expected', value: totalExpected, icon: <CheckCircle2 size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Received', value: totalReceived, icon: <CheckCircle2 size={20} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Missing', value: totalMissing, icon: <XCircle size={20} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Surplus', value: totalSurplus, icon: <TrendingUp size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: bg, color }}>{icon}</div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{label}</p>
                <p style={{ fontWeight: 700, fontSize: '1.25rem' }}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BOM Items table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'var(--bg-elevated)' }}>
                {['SKU', 'Description', 'Expected', 'Received', 'Diff', 'Status', 'Asset Tags', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.813rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => {
                const diff = item.quantityReceived - item.quantityExpected
                const isEditing = editingItemId === item.id
                const isDeleting = deletingItemId === item.id
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)', background: isDeleting ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {isEditing ? (
                        <input className="input" style={{ fontSize: '0.813rem', padding: '4px 6px', width: '80px', fontFamily: 'monospace' }}
                          value={editForm.siteKitSku} onChange={(e) => setEditForm(f => ({ ...f, siteKitSku: e.target.value }))} />
                      ) : item.siteKitSku}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', maxWidth: '250px' }}>
                      {isEditing ? (
                        <input className="input" style={{ fontSize: '0.813rem', padding: '4px 6px', width: '100%' }}
                          value={editForm.description} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} />
                      ) : item.description}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                      {isEditing ? (
                        <input className="input" type="number" min={0} style={{ fontSize: '0.813rem', padding: '4px 6px', width: '60px', textAlign: 'center' }}
                          value={editForm.quantityExpected} onChange={(e) => setEditForm(f => ({ ...f, quantityExpected: parseInt(e.target.value) || 0 }))} />
                      ) : item.quantityExpected}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{item.quantityReceived}</td>
                    <td style={{
                      padding: '12px 16px', fontWeight: 600,
                      color: diff === 0 ? '#10b981' : diff > 0 ? '#3b82f6' : '#ef4444',
                    }}>
                      {diff > 0 ? `+${diff}` : diff}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{statusBadge(item.status)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {item.assetTags.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                          {item.assetTags.slice(0, 3).map((t) => (
                            <span key={t.id} style={{
                              padding: '1px 4px', borderRadius: '3px', fontSize: '0.6rem',
                              background: t.status === 'RECEIVED' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.1)',
                              color: t.status === 'RECEIVED' ? '#10b981' : '#6b7280',
                            }}>
                              {t.assetTag}
                            </span>
                          ))}
                          {item.assetTags.length > 3 && (
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>+{item.assetTags.length - 3} more</span>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isDeleting ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>Delete?</span>
                          <button onClick={() => deleteItem(item.id)} disabled={actionLoading}
                            className="btn" style={{ padding: '3px 8px', fontSize: '0.7rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                            {actionLoading ? <Loader2 size={12} className="animate-spin" /> : 'Yes'}
                          </button>
                          <button onClick={() => setDeletingItemId(null)} className="btn" style={{ padding: '3px 8px', fontSize: '0.7rem', background: 'var(--surface-secondary)' }}>No</button>
                        </div>
                      ) : isEditing ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => saveEdit(item.id)} disabled={actionLoading}
                            title="Save" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#10b981', padding: '4px' }}>
                            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          </button>
                          <button onClick={cancelEdit} title="Cancel" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => setMatchingItem(item)} className="btn"
                            style={{ padding: '4px 8px', fontSize: '0.7rem', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)' }}>
                            <AlertCircle size={12} /> Match
                          </button>
                          <button onClick={() => startEdit(item)} title="Edit"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '4px' }}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeletingItemId(item.id)} title="Delete"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match panel */}
      {matchingItem && (
        <SiteKitMatchPanel
          siteKitDbId={data.id}
          item={matchingItem}
          onClose={() => setMatchingItem(null)}
          onMatched={() => { setMatchingItem(null); loadData() }}
        />
      )}

      {/* BOM Manual Entry */}
      {showManualEntry && (
        <BOMManualEntry
          existingSiteKitId={data.id}
          onImportComplete={() => { setShowManualEntry(false); loadData() }}
          onClose={() => setShowManualEntry(false)}
        />
      )}
    </main>
  )
}
