import { createLocation } from '@/app/actions'
import { NewLocationPageClient } from '@/app/components/NewLocationPageClient'

export const dynamic = 'force-dynamic'

export default async function NewLocationPage() {
  return <NewLocationPageClient createLocation={createLocation} />
}