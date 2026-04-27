import { getPurchaseOrders } from '@/app/actions'
import { PurchasesPageClient } from '@/app/components/PurchasesPageClient'

export const dynamic = 'force-dynamic'

export default async function PurchasesPage() {
  const purchases = await getPurchaseOrders()

  return <PurchasesPageClient purchases={purchases} />
}
