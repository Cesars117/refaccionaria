import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageInventory, normalizeRole } from '@/lib/rbac'
import { getPurchaseOrders } from '@/app/actions'
import { redirect } from 'next/navigation'
import { PurchasesPageClient } from '@/app/components/PurchasesPageClient'

export const dynamic = 'force-dynamic'

export default async function PurchasesPage() {
  const session = await getServerSession(authOptions)
  const role = normalizeRole(session?.user?.role)

  if (!canManageInventory(role)) {
    redirect('/')
  }

  const purchases = await getPurchaseOrders()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PurchasesPageClient purchases={JSON.parse(JSON.stringify(purchases))} />
    </div>
  )
}
