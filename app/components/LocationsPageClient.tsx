'use client'

import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, MapPin } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { useState } from 'react'
import { deleteLocation } from '@/app/actions'

interface Location {
  id: number
  name: string
  type: string
  description: string | null
  _count: { items: number }
}

interface LocationsPageClientProps {
  locations: Location[]
}

export function LocationsPageClient({ locations }: LocationsPageClientProps) {
  const { t } = useLanguage()
  const [deleting, setDeleting] = useState<number | null>(null)

  const handleDelete = async (location: Location) => {
    if (location._count.items > 0) {
      alert(`${t('locations.cannotDelete')}: ${location.name} (${location._count.items} ${t('locations.itemCount')})`)
      return
    }

    if (confirm(`${t('locations.confirmDelete')}: ${location.name}`)) {
      setDeleting(location.id)
      try {
        const formData = new FormData()
        formData.append('id', location.id.toString())
        await deleteLocation(formData)
      } catch (error) {
        console.error('Error deleting location:', error)
        alert(error instanceof Error ? error.message : 'Error deleting location')
        setDeleting(null)
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
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
        <ArrowLeft size={20} />
        {t('common.back')}
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="heading-xl">{t('locations.title')}</h1>
        <Link 
          href="/locations/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'var(--primary)',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          <Plus size={20} />
          {t('locations.new')}
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {locations.map((location) => (
          <div
            key={location.id}
            className="card"
            style={{
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  background: 'var(--success-light)',
                  color: 'var(--success)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem'
                }}>
                  {getTypeIcon(location.type)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                    {location.name}
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {t(`locations.types.${location.type}`)} • {location._count.items} {t('locations.itemCount')}
                  </p>
                </div>
              </div>
              {location.description && (
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {location.description}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Link
                href={`/locations/${location.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: 'var(--background)',
                  color: 'var(--text)',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid var(--border-light)',
                  transition: 'all 0.2s'
                }}
              >
                <Edit size={14} />
                {t('common.edit')}
              </Link>
              
              <button
                onClick={() => handleDelete(location)}
                disabled={deleting === location.id || location._count.items > 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: location._count.items > 0 ? 'var(--background)' : '#ef4444',
                  color: location._count.items > 0 ? 'var(--text-muted)' : 'white',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: location._count.items > 0 ? 'not-allowed' : 'pointer',
                  opacity: deleting === location.id ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <Trash2 size={14} />
                {deleting === location.id ? t('common.loading') : t('common.delete')}
              </button>
            </div>
          </div>
        ))}

        {locations.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: 'var(--text-secondary)'
          }}>
            <MapPin size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No locations created yet. Create your first location to organize inventory.</p>
          </div>
        )}
      </div>
    </main>
  )
}