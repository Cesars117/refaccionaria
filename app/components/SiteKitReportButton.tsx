'use client'

import { useState } from 'react'
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react'

interface SiteKitReportButtonProps {
  siteKitDbId: number
  status: string
}

export function SiteKitReportButton({ siteKitDbId, status }: SiteKitReportButtonProps) {
  const [downloading, setDownloading] = useState<string | null>(null)

  const disabled = status === 'PENDING'

  const download = async (format: 'pdf' | 'excel') => {
    if (disabled) return
    setDownloading(format)
    try {
      const res = await fetch(`/api/site-kits/${siteKitDbId}/report?format=${format}`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const contentDisposition = res.headers.get('content-disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      a.download = filenameMatch ? filenameMatch[1] : `report.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button
        onClick={() => download('pdf')}
        disabled={disabled || downloading !== null}
        className="btn"
        style={{
          background: disabled ? 'var(--surface-secondary)' : 'rgba(239,68,68,0.1)',
          color: disabled ? 'var(--text-secondary)' : '#ef4444',
          opacity: disabled ? 0.5 : 1,
        }}
        title={disabled ? 'Nothing verified yet' : 'Export PDF Report'}
      >
        {downloading === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
        <span style={{ marginLeft: '0.25rem' }}>PDF</span>
      </button>
      <button
        onClick={() => download('excel')}
        disabled={disabled || downloading !== null}
        className="btn"
        style={{
          background: disabled ? 'var(--surface-secondary)' : 'rgba(16,185,129,0.1)',
          color: disabled ? 'var(--text-secondary)' : '#10b981',
          opacity: disabled ? 0.5 : 1,
        }}
        title={disabled ? 'Nothing verified yet' : 'Export Excel Report'}
      >
        {downloading === 'excel' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
        <span style={{ marginLeft: '0.25rem' }}>Excel</span>
      </button>
    </div>
  )
}
