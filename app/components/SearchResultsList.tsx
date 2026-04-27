'use client'

import { useState } from 'react'
import { Package, MapPin, Tag, ChevronDown, Edit, Barcode as BarcodeIcon } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/app/contexts/LanguageContext'

interface Item {
  id: number
  name: string
  description: string | null
  barcode: string | null
  quantity: number
  status: string
  unitType: string | null
  unitsPerBox: number | null
  totalUnits: number | null
  sku: string | null
  siteKitSku: string | null
  category: { name: string }
  location: { name: string }
  serialNumbers: Array<{ id: number; serialNumber: string | null; tmoSerial: string | null }>
}

interface SearchResultsListProps {
  items: Item[]
  query: string
}

export function SearchResultsList({ items, query }: SearchResultsListProps) {
  const { t } = useLanguage()
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }
      case 'IN_USE':
        return { bg: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }
      case 'MAINTENANCE':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }
      case 'LOST':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
      default:
        return { bg: 'rgba(156, 163, 175, 0.1)', color: 'var(--text-secondary)' }
    }
  }

  if (items.length === 0) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
        <Package size={48} style={{ color: 'var(--text-secondary)', opacity: 0.3, margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          {t('dashboard.noSearchResults')} &quot;{query}&quot;
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '12px 0'
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {items.length} {items.length === 1 ? 'result' : 'results'} {t('common.search').toLowerCase()}
        </p>
      </div>

      {items.map((item) => {
        const isExpanded = expandedId === item.id
        const statusStyle = getStatusColor(item.status)
        const isBoxType = (item.unitType === 'BOX' || item.unitsPerBox) && item.unitsPerBox && typeof item.unitsPerBox === 'number'

        return (
          <div
            key={item.id}
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              transition: 'all 0.2s',
              border: '1px solid var(--border-light)'
            }}
          >
            {/* Card Header - Always Visible */}
            <div
              onClick={() => toggleExpand(item.id)}
              style={{
                padding: '20px 24px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                background: isExpanded ? 'var(--bg-elevated)' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Icon */}
                <div style={{
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Package size={24} />
                </div>

                {/* Main Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    margin: '0 0 4px 0', 
                    fontSize: '1.125rem', 
                    fontWeight: 600,
                    color: 'var(--text)'
                  }}>
                    {item.name}
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    gap: '12px', 
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Tag size={14} />
                      {item.category.name}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} />
                      {item.location.name}
                    </span>
                    {item.barcode && (
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace'
                      }}>
                        <BarcodeIcon size={14} />
                        {item.barcode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Info */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  flexShrink: 0
                }}>
                  {/* Quantity */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)' }}>
                      {isBoxType 
                        ? `${item.totalUnits || (item.quantity * (item.unitsPerBox as number))} units - ${item.quantity} box`
                        : item.quantity
                      }
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {isBoxType 
                        ? t('dashboard.units')
                        : t('common.quantity')
                      }
                    </div>
                    {isBoxType && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {item.quantity} cajas
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}>
                      {t(`status.${item.status}`)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expand Icon */}
              <div style={{ 
                color: 'var(--text-secondary)',
                transition: 'transform 0.2s',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>
                <ChevronDown size={20} />
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div style={{
                padding: '0 24px 20px 24px',
                borderTop: '1px solid var(--border-light)',
                animation: 'slideDown 0.2s ease-out'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                  padding: '20px 0'
                }}>
                  {/* Description */}
                  {item.description && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '8px',
                        display: 'block'
                      }}>
                        {t('common.description')}
                      </label>
                      <p style={{ 
                        margin: 0, 
                        color: 'var(--text)',
                        lineHeight: '1.5'
                      }}>
                        {item.description}
                      </p>
                    </div>
                  )}

                  {/* SKU */}
                  {item.sku && (
                    <div>
                      <label style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '8px',
                        display: 'block'
                      }}>
                        SKU
                      </label>
                      <p style={{ 
                        margin: 0, 
                        color: 'var(--text)',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }}>
                        {item.sku}
                      </p>
                    </div>
                  )}

                  {/* Site Kit SKU */}
                  {item.siteKitSku && (
                    <div>
                      <label style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '8px',
                        display: 'block'
                      }}>
                        Site Kit SKU
                      </label>
                      <p style={{ 
                        margin: 0, 
                        color: 'var(--text)',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }}>
                        {item.siteKitSku}
                      </p>
                    </div>
                  )}

                  {/* Unit Type Details */}
                  {isBoxType && (
                    <>
                      <div>
                        <label style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '8px',
                          display: 'block'
                        }}>
                          {t('newItem.unitsPerBox')}
                        </label>
                        <p style={{ margin: 0, color: 'var(--text)', fontSize: '1rem', fontWeight: 500 }}>
                          {item.unitsPerBox}
                        </p>
                      </div>
                      <div>
                        <label style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '8px',
                          display: 'block'
                        }}>
                          {t('newItem.totalUnits')}
                        </label>
                        <p style={{ margin: 0, color: 'var(--text)', fontSize: '1rem', fontWeight: 500 }}>
                          {item.totalUnits || (item.unitsPerBox ? item.quantity * item.unitsPerBox : item.quantity)}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Serial Numbers */}
                {item.serialNumbers && item.serialNumbers.length > 0 && (
                  <div style={{ padding: '12px 0' }}>
                    <label style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      color: 'var(--primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '8px',
                      display: 'block'
                    }}>
                      🔢 {t('serialNumbers.title')} ({item.serialNumbers.length})
                    </label>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {item.serialNumbers.map((sn, i) => (
                        <div key={sn.id} style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '4px 0',
                          fontSize: '0.8rem',
                          borderBottom: i < item.serialNumbers.length - 1 ? '1px solid var(--border-light)' : 'none'
                        }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>#{i + 1}</span>
                          {sn.serialNumber && <span style={{ fontFamily: 'monospace' }}>SN: {sn.serialNumber}</span>}
                          {sn.tmoSerial && <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>TMO: {sn.tmoSerial}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ 
                  display: 'flex', 
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-light)'
                }}>
                  <Link
                    href={`/items/${item.id}`}
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <Edit size={16} />
                    {t('itemDetails.editItem')}
                  </Link>
                </div>
              </div>
            )}

            <style jsx>{`
              @keyframes slideDown {
                from {
                  opacity: 0;
                  transform: translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </div>
        )
      })}
    </div>
  )
}
