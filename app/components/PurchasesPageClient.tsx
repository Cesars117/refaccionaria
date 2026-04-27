'use client'

import Link from 'next/link'
import { ArrowLeft, Plus, ShoppingCart, Truck, Calendar, DollarSign } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'

interface PurchaseOrder {
  id: number
  orderNumber: string
  status: string
  totalAmount: number
  supplier: { name: string }
  _count: { itemsBought: number }
  createdAt: Date
}

interface PurchasesPageClientProps {
  purchases: PurchaseOrder[]
}

export function PurchasesPageClient({ purchases }: PurchasesPageClientProps) {
  const { t } = useLanguage()

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
        <ArrowLeft size={20} />
        {t('common.back')}
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-xl">Módulo de Compras</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Registra la entrada de mercancía y actualización de precios de costo.</p>
        </div>
        <Link 
          href="/purchases/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'var(--primary)',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          <Plus size={20} />
          Registrar Compra
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {purchases.map((purchase) => (
          <div
            key={purchase.id}
            className="card"
            style={{
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                    Orden: {purchase.orderNumber}
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <Truck size={14} />
                      {purchase.supplier.name}
                    </span>
                    <span style={{ 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      color: 'var(--success)', 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      padding: '2px 8px', 
                      borderRadius: '12px' 
                    }}>
                      {purchase.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '24px', marginTop: '12px', paddingLeft: '60px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <ShoppingCart size={14} />
                  {purchase._count.itemsBought} Refacciones
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <Calendar size={14} />
                  {new Date(purchase.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
               <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Total de Compra</div>
               <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)" }}>${purchase.totalAmount.toLocaleString()}</div>
            </div>
          </div>
        ))}

        {purchases.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: 'var(--text-secondary)'
          }}>
            <ShoppingCart size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No se han registrado compras aún. Registra tu primera entrada de mercancía.</p>
          </div>
        )}
      </div>
    </main>
  )
}
