'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'

interface NewCategoryPageClientProps {
  createCategory: (formData: FormData) => Promise<void>
}

export function NewCategoryPageClient({ createCategory }: NewCategoryPageClientProps) {
  const { t } = useLanguage()

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <Link href="/categories" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
        <ArrowLeft size={20} />
        {t('common.back')}
      </Link>

      <h1 className="heading-xl">{t('categories.new')}</h1>
      
      <div className="card" style={{ maxWidth: "600px", padding: "2rem" }}>
        <form action={createCategory} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              {t('categories.name')}
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
              {t('categories.description')}
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
            {t('categories.create')}
          </button>
        </form>
      </div>
    </main>
  )
}