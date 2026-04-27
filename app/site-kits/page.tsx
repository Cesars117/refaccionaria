'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Package, ArrowLeft, Loader2, FileText } from 'lucide-react'
import { BOMManualEntry } from '@/app/components/BOMManualEntry'

interface SiteKitSummary {
  id: number
  siteKitId: string
  siteId: string | null
  projectName: string | null
  bomId: string | null
  status: string
  createdAt: string
  totalItems: number
  verified: number
  matchPct: number
}

export default function SiteKitsPage() {
  const [siteKits, setSiteKits] = useState<SiteKitSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/site-kits')
      if (res.ok) setSiteKits(await res.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      PENDING: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
      IN_PROGRESS: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
      COMPLETE: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
      DISCREPANCY: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    }
    const s = map[status] || map.PENDING
    return (
      <span style={{
        padding: '3px 10px', borderRadius: '9999px', fontSize: '0.7rem',
        fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap',
      }}>
        {status}
      </span>
    )
  }

  return (
    <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)' }}><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="heading-xl">T-Mobile BOM / Site Kits</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Compare BOM deliveries vs actual inventory</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowNewForm(true)} className="btn btn-primary">
            <FileText size={18} /> Entrada Manual
          </button>
        </div>
      </header>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} />
        </div>
      ) : siteKits.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <Package size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto', opacity: 0.4 }} />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No Site Kits yet. Create one or import from a BOM photo.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'var(--bg-elevated)' }}>
                  {['Site Kit ID', 'Site ID', 'Project', 'BOM ID', 'Items', 'Verified', 'Match %', 'Status', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.813rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {siteKits.map((sk) => (
                  <tr key={sk.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/site-kits/${sk.id}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                        {sk.siteKitId}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{sk.siteId || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{sk.projectName || '—'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{sk.bomId || '—'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{sk.totalItems}</td>
                    <td style={{ padding: '12px 16px' }}>{sk.verified}/{sk.totalItems}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '60px', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${sk.matchPct}%`, height: '100%', borderRadius: '3px',
                            background: sk.matchPct === 100 ? '#10b981' : sk.matchPct > 50 ? '#f59e0b' : '#ef4444',
                          }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{sk.matchPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{statusBadge(sk.status)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.813rem' }}>
                      {new Date(sk.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Site Kit — Full Manual BOM Entry */}
      {showNewForm && (
        <BOMManualEntry
          onImportComplete={() => { setShowNewForm(false); loadData() }}
          onClose={() => setShowNewForm(false)}
        />
      )}
    </main>
  )
}
