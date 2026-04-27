'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { EditItemForm } from './EditItemForm'
import { DeleteItemForm } from './DeleteItemForm'

interface EditItemPageClientProps {
  item: {
    id: number
    name: string
    barcode?: string | null
    categoryId: number
    locationId: number
    quantity: number
    status: string
    description?: string | null
    unitType?: string | null
    unitsPerBox?: number | null
    siteKitSku?: string | null
    serialNumbers?: Array<{ id: number; serialNumber: string | null; tmoSerial: string | null }>
  }
  categories: Array<{ id: number; name: string }>
  locations: Array<{ id: number; name: string }>
  updateItem: (formData: FormData) => Promise<void>
  deleteItem: (formData: FormData) => Promise<void>
}

export function EditItemPageClient({ item, categories, locations, updateItem, deleteItem }: EditItemPageClientProps) {
  const { t } = useLanguage()

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
        <ArrowLeft size={20} />
        {t('common.back')}
      </Link>

      <h1 className="heading-xl">{t('editItem.title')}</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
        {t('editItem.editingItem')}: <strong>{item.name}</strong>
      </p>
      
      <EditItemForm 
        item={item}
        categories={categories}
        locations={locations}
        updateItem={updateItem}
      />

      <div style={{ maxWidth: "600px", marginTop: "2rem" }}>
        <DeleteItemForm 
          itemId={item.id} 
          itemName={item.name}
          serialNumbers={item.serialNumbers || []}
          deleteItem={deleteItem} 
        />
      </div>
    </main>
  )
}
