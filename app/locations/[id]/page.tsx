import { getLocationById, updateLocation, deleteLocation } from '@/app/actions'
import { redirect } from 'next/navigation'
import { EditLocationPageClient } from '@/app/components/EditLocationPageClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditLocationPage({ params }: Props) {
  const { id } = await params
  const location = await getLocationById(parseInt(id))

  if (!location) {
    redirect('/locations')
  }

  return (
    <EditLocationPageClient 
      location={location}
      updateLocation={updateLocation}
      deleteLocation={deleteLocation}
    />
  )
}