import { getCategoryById, updateCategory, deleteCategory } from '@/app/actions'
import { redirect } from 'next/navigation'
import { EditCategoryPageClient } from '@/app/components/EditCategoryPageClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params
  const category = await getCategoryById(parseInt(id))

  if (!category) {
    redirect('/categories')
  }

  return (
    <EditCategoryPageClient 
      category={category}
      updateCategory={updateCategory}
      deleteCategory={deleteCategory}
    />
  )
}