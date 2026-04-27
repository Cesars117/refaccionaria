'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

interface AuditLogEntry {
  id: number
  userId: string
  userEmail: string | null
  userName: string | null
  action: string
  entityType: string
  entityId: number
  entityLabel: string | null
  fieldChanged: string | null
  oldValue: string | null
  newValue: string | null
  createdAt: string
}

const ACTION_BADGES: Record<string, { bg: string; color: string }> = {
  CREATED: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  UPDATED: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  DELETED: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
  STATUS_CHANGED: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  QTY_CHANGED: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  VERIFIED: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  LINKED: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
}

const ENTITY_TYPES = ['ITEM', 'SERIAL_NUMBER', 'SITE_KIT', 'SITE_KIT_ITEM', 'ASSET_TAG']
const ACTIONS = ['CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'QTY_CHANGED', 'VERIFIED', 'LINKED']

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [filterEntityType, setFilterEntityType] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const limit = 50

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (filterEntityType) params.set('entityType', filterEntityType)
      if (filterAction) params.set('action', filterAction)
      if (filterFrom) params.set('from', filterFrom)
      if (filterTo) params.set('to', filterTo)

      const res = await fetch(`/api/audit-log?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setTotal(data.total)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, filterEntityType, filterAction, filterFrom, filterTo])

  useEffect(() => { loadLogs() }, [loadLogs])

  const totalPages = Math.ceil(total / limit)

  const actionBadge = (action: string) => {
    const style = ACTION_BADGES[action] || { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' }
    return (
      <span style={{
        padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem',
        fontWeight: 600, background: style.bg, color: style.color,
      }}>
        {action}
      </span>
    )
  }

  const resetFilters = () => {
    setFilterEntityType('')
    setFilterAction('')
    setFilterFrom('')
    setFilterTo('')
    setPage(1)
  }

  return (
    <main className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)' }}><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="heading-xl">Audit Log</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{total} entries</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn"
          style={{ background: showFilters ? 'rgba(99,102,241,0.15)' : 'var(--surface-secondary)', color: showFilters ? 'var(--primary)' : undefined }}
        >
          <Filter size={16} /> Filters
        </button>
      </header>

      {/* Filters */}
      {showFilters && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Entity Type</label>
              <select className="input" value={filterEntityType} onChange={(e) => { setFilterEntityType(e.target.value); setPage(1) }} style={{ width: '100%' }}>
                <option value="">All</option>
                {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Action</label>
              <select className="input" value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1) }} style={{ width: '100%' }}>
                <option value="">All</option>
                {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>From</label>
              <input type="date" className="input" value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setPage(1) }} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>To</label>
              <input type="date" className="input" value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setPage(1) }} style={{ width: '100%' }} />
            </div>
            <button onClick={resetFilters} className="btn" style={{ background: 'var(--surface-secondary)' }}>Clear</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto', color: 'var(--text-secondary)' }} />
        </div>
      ) : logs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          No audit log entries found.
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'var(--bg-elevated)' }}>
                    {['Date/Time', 'User', 'Action', 'Entity', 'Field', 'Old Value', 'New Value'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.813rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '10px 14px', fontSize: '0.813rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.813rem' }}>
                        {log.userName || log.userEmail || log.userId}
                      </td>
                      <td style={{ padding: '10px 14px' }}>{actionBadge(log.action)}</td>
                      <td style={{ padding: '10px 14px', fontSize: '0.813rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{log.entityType}</span>
                        <br />
                        {log.entityLabel || `#${log.entityId}`}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
                        {log.fieldChanged || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.813rem', color: '#ef4444' }}>
                        {log.oldValue || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.813rem', color: '#10b981' }}>
                        {log.newValue || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn"
                style={{ background: 'var(--surface-secondary)', padding: '6px 12px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn"
                style={{ background: 'var(--surface-secondary)', padding: '6px 12px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
