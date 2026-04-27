import { getLocations } from '@/app/actions'
import { LocationsPageClient } from '@/app/components/LocationsPageClient'

export const dynamic = 'force-dynamic'

export default async function LocationsPage() {
  const locations = await getLocations()

  return <LocationsPageClient locations={locations} />
}