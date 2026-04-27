import { getItemById, updateItem, deleteItem } from '@/app/actions'
import { redirect } from 'next/navigation'
import db from '@/lib/db'
import { EditItemPageClient } from '@/app/components/EditItemPageClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditItemPage({ params }: Props) {
  const { id } = await params
  const [item, categories, locations] = await Promise.all([
    getItemById(parseInt(id)),
    db.category.findMany({ orderBy: { name: 'asc' } }),
    db.location.findMany({ orderBy: { name: 'asc' } })
  ])

  if (!item) {
    redirect('/')
  }

  return (
    <EditItemPageClient 
      item={item}
      categories={categories}
      locations={locations}
      updateItem={updateItem}
      deleteItem={deleteItem}
    />
  )
}
