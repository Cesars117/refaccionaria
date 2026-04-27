'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'

interface NewLocationPageClientProps {
  createLocation: (formData: FormData) => Promise<void>
}

export function NewLocationPageClient({ createLocation }: NewLocationPageClientProps) {
  const { t } = useLanguage()

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <Link href="/locations" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
        <ArrowLeft size={20} />
        {t('common.back')}
      </Link>

      <h1 className="heading-xl">{t('locations.new')}</h1>
      
      <div className="card" style={{ maxWidth: "600px", padding: "2rem" }}>
        <form action={createLocation} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              {t('locations.name')}
            </label>
            <input 
              name="name" 
              type="text" 
              required 
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
            {t('locations.create')}
          </button>
        </form>
      </div>
    </main>
  )
}