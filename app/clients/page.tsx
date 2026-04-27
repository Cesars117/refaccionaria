import { getClients } from '@/app/actions'
import { ClientsPageClient } from '@/app/components/ClientsPageClient'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const clients = await getClients()

  return <ClientsPageClient clients={clients} />
}
