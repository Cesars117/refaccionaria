'use client'

import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { useState } from 'react'

interface Location {
  id: number
  name: string
  type: string
  description: string | null
  _count: { items: number }
}

interface EditLocationPageClientProps {
  location: Location
  updateLocation: (formData: FormData) => Promise<void>
  deleteLocation: (formData: FormData) => Promise<void>
}

export function EditLocationPageClient({ location, updateLocation, deleteLocation }: EditLocationPageClientProps) {
  const { t } = useLanguage()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (location._count.items > 0) {
      alert(`${t('locations.cannotDelete')}: ${location.name} (${location._count.items} ${t('locations.itemCount')})`)
      return
    }

    if (confirm(`${t('locations.confirmDelete')}: ${location.name}`)) {
      setDeleting(true)
      try {
        const formData = new FormData()
        formData.append('id', location.id.toString())
        await deleteLocation(formData)
      } catch (error) {
        console.error('Error deleting location:', error)
        alert(error instanceof Error ? error.message : 'Error deleting location')
        setDeleting(false)
      }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WAREHOUSE': return '🏢'
      case 'VEHICLE': return '🚛'
      case 'SITE': return '🏗️'
      default: return '📍'
    }
  }

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <Link href="/locations" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
        <ArrowLeft size={20} />
        {t('common.back')}
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="heading-xl">{t('locations.edit')}</h1>
        
        {location._count.items === 0 ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            <Trash2 size={16} />
            {deleting ? t('common.loading') : t('common.delete')}
          </button>
        ) : (
          <div style={{
            padding: '12px 24px',
            background: 'var(--warning-light)',
            color: 'var(--warning)',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            {location._count.items} {t('locations.itemCount')} - {t('locations.cannotDelete')}
          </div>
        )}
      </div>

      <div className="card" style={{ maxWidth: "600px", padding: "2rem" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', padding: '16px', background: 'var(--success-light)', borderRadius: '8px' }}>
          <div style={{
            background: 'white',
            color: 'var(--success)',
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}>
            {getTypeIcon(location.type)}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--text)' }}>
              {location.name}
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {t(`locations.types.${location.type}`)} • {location._count.items} {t('locations.itemCount')}
            </p>
          </div>
        </div>

        <form action={updateLocation} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <input type="hidden" name="id" value={location.id} />
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              {t('locations.name')}
            </label>
            <input 
              name="name" 
              type="text" 
              required 
              defaultValue={location.name}
              style={{ 
                width: "100%", 
                padding: "12px", 
                background: "var(--bg-elevated)", 
                border: "1px solid var(--border-light)", 
                color: "var(--text-main)", 
                borderRadius: "var(--radius-sm)", 
                outline: "none" 
              }} 
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              {t('locations.type')}
            </label>
            <select 
              name="type" 
              required
              defaultValue={location.type}
              style={{ 
                width: "100%", 
                padding: "12px", 
                background: "var(--bg-elevated)", 
                border: "1px solid var(--border-light)", 
                color: "var(--text-main)", 
                borderRadius: "var(--radius-sm)", 
                outline: "none" 
              }}
            >
              <option value="WAREHOUSE">{t('locations.types.WAREHOUSE')}</option>
              <option value="VEHICLE">{t('locations.types.VEHICLE')}</option>
              <option value="SITE">{t('locations.types.SITE')}</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              {t('locations.description')}
            </label>
            <textarea 
              name="description" 
              rows={3}
              defaultValue={location.description || ''}
              style={{ 
                width: "100%", 
                padding: "12px", 
                background: "var(--bg-elevated)", 
                border: "1px solid var(--border-light)", 
                color: "var(--text-main)", 
                borderRadius: "var(--radius-sm)", 
                outline: "none",
                resize: "vertical" 
              }} 
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ alignSelf: "flex-start" }}
          >
            {t('locations.update')}
          </button>
        </form>
      </div>
    </main>
  )
}