'use client'

import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Users, Car, Phone, Mail } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { useState } from 'react'

interface Client {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  _count: { vehicles: number; projects: number }
}

interface ClientsPageClientProps {
  clients: Client[]
}

export function ClientsPageClient({ clients }: ClientsPageClientProps) {
  const { t } = useLanguage()

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
        <ArrowLeft size={20} />
        {t('common.back')}
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-xl">Clientes y Flotas</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Administra tus clientes y los vehículos de sus flotas.</p>
        </div>
        <Link 
          href="/clients/new"
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
          Nuevo Cliente
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {clients.map((client) => (
          <div
            key={client.id}
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
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--primary)',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                    {client.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <Car size={14} />
                      {client._count.vehicles} Vehículos
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <Users size={14} />
                      {client._count.projects} Contratos
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '24px', marginTop: '12px', paddingLeft: '60px' }}>
                {client.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Phone size={14} />
                    {client.phone}
                  </span>
                )}
                {client.email && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Mail size={14} />
                    {client.email}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Link
                href={`/clients/${client.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: 'var(--background)',
                  color: 'var(--text)',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid var(--border-light)',
                  transition: 'all 0.2s'
                }}
              >
                <Edit size={14} />
                Ver/Editar
              </Link>
            </div>
          </div>
        ))}

        {clients.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: 'var(--text-secondary)'
          }}>
            <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No hay clientes registrados aún. Crea tu primer cliente para comenzar.</p>
          </div>
        )}
      </div>
    </main>
  )
}
