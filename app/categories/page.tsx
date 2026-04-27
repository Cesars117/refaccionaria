import { getCategories } from '@/app/actions'
import { CategoriesPageClient } from '@/app/components/CategoriesPageClient'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const categories = await getCategories()

  return <CategoriesPageClient categories={categories} />
}