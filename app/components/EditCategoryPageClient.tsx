'use client'

import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { useState } from 'react'

interface Category {
  id: number
  name: string
  description: string | null
  _count: { items: number }
}

interface EditCategoryPageClientProps {
  category: Category
  updateCategory: (formData: FormData) => Promise<void>
  deleteCategory: (formData: FormData) => Promise<void>
}

export function EditCategoryPageClient({ category, updateCategory, deleteCategory }: EditCategoryPageClientProps) {
  const { t } = useLanguage()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (category._count.items > 0) {
      alert(`${t('categories.cannotDelete')}: ${category.name} (${category._count.items} ${t('categories.itemCount')})`)
      return
    }

    if (confirm(`${t('categories.confirmDelete')}: ${category.name}`)) {
      setDeleting(true)
      try {
        const formData = new FormData()
        formData.append('id', category.id.toString())
        await deleteCategory(formData)
      } catch (error) {
        console.error('Error deleting category:', error)
        alert(error instanceof Error ? error.message : 'Error deleting category')
        setDeleting(false)
      }
    }
  }

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <Link href="/categories" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
        <ArrowLeft size={20} />
        {t('common.back')}
      </Link>

      <h1 className="heading-xl">{t('categories.edit')}</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
        {category._count.items} {t('categories.itemCount')} associated
      </p>
      
      <div className="card" style={{ maxWidth: "600px", padding: "2rem" }}>
        <form action={updateCategory} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <input type="hidden" name="id" value={category.id} />
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              {t('categories.name')}
            </label>
            <input 
              name="name" 
              type="text" 
              required 
              defaultValue={category.name}
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
              defaultValue={category.description || ''}
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

          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              type="submit" 
              className="btn-primary" 
            >
              {t('categories.update')}
            </button>
            
            <button 
              type="button"
              onClick={handleDelete}
              disabled={deleting || category._count.items > 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: category._count.items > 0 ? 'var(--background)' : '#ef4444',
                color: category._count.items > 0 ? 'var(--text-muted)' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: category._count.items > 0 ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >
              <Trash2 size={16} />
              {deleting ? t('common.loading') : t('categories.delete')}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}