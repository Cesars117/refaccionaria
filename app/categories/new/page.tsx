import { createCategory } from '@/app/actions'
import { NewCategoryPageClient } from '@/app/components/NewCategoryPageClient'

export const dynamic = 'force-dynamic'

export default async function NewCategoryPage() {
  return <NewCategoryPageClient createCategory={createCategory} />
}