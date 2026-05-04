import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageFinances } from '@/lib/rbac'
import { getFinancialEntries } from '@/app/actions'
import { redirect } from 'next/navigation'
import FinancialClient from './FinancialClient'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function FinanzasPage() {
  const session = await getServerSession(authOptions)
  
  if (!canManageFinances(session?.user?.role)) {
    redirect('/')
  }

  const entries = await getFinancialEntries()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/reportes" className="text-brand-600 hover:text-brand-700 text-sm font-medium flex items-center gap-1 mb-2">
            <ChevronLeft size={16} />
            Volver a Reportes
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Gestión Financiera</h1>
          <p className="text-sm text-gray-500">Control de inversiones, renta, nómina y flujos de caja.</p>
        </div>
      </div>

      <FinancialClient initialEntries={JSON.parse(JSON.stringify(entries))} />
    </div>
  )
}
