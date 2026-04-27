'use client'

import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Package } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { useState } from 'react'
import { deleteCategory } from '@/app/actions'

interface Category {
  id: number
  name: string
  description: string | null
  _count: { items: number }
}

interface CategoriesPageClientProps {
  categories: Category[]
}

export function CategoriesPageClient({ categories }: CategoriesPageClientProps) {
  const { t } = useLanguage()
  const [deleting, setDeleting] = useState<number | null>(null)

  const handleDelete = async (category: Category) => {
    if (category._count.items > 0) {
      alert(`${t('categories.cannotDelete')}: ${category.name} (${category._count.items} ${t('categories.itemCount')})`)
      return
    }

    if (confirm(`${t('categories.confirmDelete')}: ${category.name}`)) {
      setDeleting(category.id)
      try {
        const formData = new FormData()
        formData.append('id', category.id.toString())
        await deleteCategory(formData)
      } catch (error) {
        console.error('Error deleting category:', error)
        alert(error instanceof Error ? error.message : 'Error deleting category')
        setDeleting(null)
      }
    }
  }

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
        <ArrowLeft size={20} />
        {t('common.back')}
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="heading-xl">{t('categories.title')}</h1>
        <Link 
          href="/categories/new"
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
          {t('categories.new')}
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {categories.map((category) => (
          <div
            key={category.id}
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
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Package size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                    {category.name}
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {category._count.items} {t('categories.itemCount')}
                  </p>
                </div>
              </div>
              {category.description && (
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {category.description}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Link
                href={`/categories/${category.id}`}
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
                onClick={() => handleDelete(category)}
                disabled={deleting === category.id || category._count.items > 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: category._count.items > 0 ? 'var(--background)' : '#ef4444',
                  color: category._count.items > 0 ? 'var(--text-muted)' : 'white',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: category._count.items > 0 ? 'not-allowed' : 'pointer',
                  opacity: deleting === category.id ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <Trash2 size={14} />
                {deleting === category.id ? t('common.loading') : t('common.delete')}
              </button>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: 'var(--text-secondary)'
          }}>
            <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No categories created yet. Create your first category to organize inventory.</p>
          </div>
        )}
      </div>
    </main>
  )
}