'use client'

import Link from 'next/link'
import { ArrowLeft, Plus, ClipboardList, User, Car, Calendar, Trash2 } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { useState } from 'react'
import { deleteProject } from '@/app/actions'

interface Project {
  id: number
  name: string
  status: string
  client: { name: string }
  vehicle: { model: string; plate: string | null } | null
  _count: { serviceOrders: number }
  updatedAt: Date
}

interface ProjectsPageClientProps {
  projects: any[]
}

export function ProjectsPageClient({ projects }: ProjectsPageClientProps) {
  const { t } = useLanguage()
  const [deleting, setDeleting] = useState<number | null>(null)

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el proyecto "${name}"?`)) {
      setDeleting(id)
      try {
        const formData = new FormData()
        formData.append('id', id.toString())
        await deleteProject(formData)
      } catch (error) {
        alert('Error al eliminar proyecto')
        setDeleting(null)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--success)' }
      case 'COMPLETED': return { bg: 'rgba(59, 130, 246, 0.1)', text: 'var(--primary)' }
      case 'ON_HOLD': return { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--warning)' }
      default: return { bg: 'rgba(107, 114, 128, 0.1)', text: 'var(--text-secondary)' }
    }
  }

  return (
    <main className="container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", marginBottom: "2rem", textDecoration: "none" }}>
        <ArrowLeft size={20} />
        {t('common.back')}
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-xl">Proyectos de Mantenimiento</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Administra los contratos de mantenimiento, frenos y radiadores.</p>
        </div>
        <Link 
          href="/projects/new"
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
          Nuevo Proyecto
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {projects.map((project) => {
          const statusStyle = getStatusColor(project.status)
          return (
            <div
              key={project.id}
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
                    background: 'rgba(168, 85, 247, 0.1)',
                    color: '#a855f7',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                      {project.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px', alignItems: 'center' }}>
                      <span style={{ 
                        background: statusStyle.bg, 
                        color: statusStyle.text, 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        padding: '2px 8px', 
                        borderRadius: '12px' 
                      }}>
                        {project.status}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <User size={14} />
                        {project.client.name}
                      </span>
                      {project.vehicle && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          <Car size={14} />
                          {project.vehicle.model} ({project.vehicle.plate || 'No Placas'})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '24px', marginTop: '12px', paddingLeft: '60px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <ClipboardList size={14} />
                    {project._count.serviceOrders} Órdenes de Servicio
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Calendar size={14} />
                    Actualizado: {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  href={`/projects/${project.id}`}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                >
                  Detalles
                </Link>
                <button
                   onClick={() => handleDelete(project.id, project.name)}
                   disabled={deleting === project.id}
                   style={{
                     background: 'rgba(239, 68, 68, 0.1)',
                     color: '#ef4444',
                     border: 'none',
                     padding: '8px',
                     borderRadius: '6px',
                     cursor: 'pointer',
                     opacity: deleting === project.id ? 0.5 : 1
                   }}
                >
                   <Trash2 size={18} />
                </button>
              </div>
            </div>
          )
        })}

        {projects.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: 'var(--text-secondary)'
          }}>
            <ClipboardList size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No hay proyectos activos registrados. Crea uno nuevo para comenzar el seguimiento.</p>
          </div>
        )}
      </div>
    </main>
  )
}
