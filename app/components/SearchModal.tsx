'use client'

import { useState, useEffect } from 'react'
import { X, Package, MapPin, Tag, Barcode as BarcodeIcon, Edit, Check } from 'lucide-react'
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

interface SearchModalProps {
  items: Item[]
  query: string
  onClose: () => void
}

export function SearchModal({ items, query, onClose }: SearchModalProps) {
  const { t } = useLanguage()
  // Auto-select first item if there's only one (from table click)
  const [selectedItem, setSelectedItem] = useState<Item | null>(() => items.length === 1 ? items[0] : null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000,
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '10px' : '20px',
      backdropFilter: 'blur(4px)',
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'white',
        borderRadius: isMobile ? '12px' : '16px',
        maxWidth: isMobile ? '100%' : (selectedItem ? '900px' : '700px'),
        width: '100%',
        maxHeight: isMobile ? '95vh' : '90vh',
        minHeight: isMobile ? '300px' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        transition: 'max-width 0.3s',
        margin: isMobile ? '10px 0' : '0'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '16px' : '24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ flex: 1 }}>
            {items.length > 1 && (
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
                {items.length} results found for:
              </p>
            )}
            <h2 style={{ 
              margin: 0, 
              fontSize: items.length === 1 ? '2rem' : '1.75rem', 
              fontWeight: 700, 
              color: 'var(--text)',
              lineHeight: '1.2'
            }}>
              {query}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background 0.2s',
              flexShrink: 0
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--background)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ 
          display: 'flex', 
          flex: 1, 
          overflow: 'hidden',
          flexDirection: isMobile && selectedItem ? 'column' : 'row'
        }}>
          {/* Items List */}
          <div style={{
            flex: selectedItem ? (isMobile ? 'none' : '0 0 300px') : 1,
            overflowY: 'auto',
            padding: isMobile ? '12px' : '16px',
            borderRight: selectedItem && !isMobile ? '1px solid var(--border-light)' : 'none',
            borderBottom: selectedItem && isMobile ? '1px solid var(--border-light)' : 'none',
            transition: 'flex 0.3s',
            display: isMobile && selectedItem ? 'none' : 'block'
          }}>
            {items.map((item) => {
              const isSelected = selectedItem?.id === item.id
              const statusStyle = getStatusColor(item.status)

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    padding: '16px',
                    marginBottom: '12px',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: isSelected ? 'var(--primary-light)' : 'white',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--background)'
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'white'
                  }}
                >
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'var(--primary)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={16} />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Package size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '1.125rem', 
                        fontWeight: 700, 
                        color: '#000000',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '6px'
                      }}>
                        {item.name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: '#666666', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div>{item.category.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} />
                          {item.location.name}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {((item.unitType === 'BOX' || item.unitsPerBox) && item.unitsPerBox && typeof item.unitsPerBox === 'number')
                        ? `${item.totalUnits || (item.quantity * item.unitsPerBox)} units`
                        : `Qty: ${item.quantity || 0}`
                      }
                    </span>
                    <span style={{
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {t(`status.${item.status}`)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Item Details */}
          {selectedItem && (
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? '16px' : '24px',
              animation: 'slideInRight 0.3s ease-out'
            }}>
              {isMobile && (
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.875rem'
                  }}
                >
                  ← {t('common.back')}
                </button>
              )}
              {/* Item Header */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: items.length === 1 ? 'column' : 'row',
                  alignItems: 'center', 
                  gap: '16px', 
                  marginBottom: '12px',
                  textAlign: items.length === 1 ? 'center' : 'left'
                }}>
                  <div style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    width: items.length === 1 ? '80px' : '64px',
                    height: items.length === 1 ? '80px' : '64px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Package size={items.length === 1 ? 40 : 32} />
                  </div>
                  <div style={{ flex: items.length === 1 ? 'none' : 1, width: items.length === 1 ? '100%' : 'auto' }}>
                    <h3 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: items.length === 1 ? '3rem' : '1.5rem', 
                      fontWeight: 800, 
                      color: '#000000',
                      textAlign: items.length === 1 ? 'center' : 'left',
                      lineHeight: '1.1'
                    }}>
                      {selectedItem.name}
                    </h3>
                    <div style={{
                      display: items.length === 1 ? 'flex' : 'inline-block',
                      justifyContent: items.length === 1 ? 'center' : 'flex-start',
                      background: getStatusColor(selectedItem.status).bg,
                      color: getStatusColor(selectedItem.status).color,
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}>
                      {t(`status.${selectedItem.status}`)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description - Highlighted */}
              {selectedItem.description && (
                <div style={{
                  background: 'var(--primary-light)',
                  border: '2px solid var(--primary)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <label style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '12px',
                    display: 'block'
                  }}>
                    📋 {t('common.description')}
                  </label>
                  <p style={{
                    margin: 0,
                    color: 'var(--text)',
                    fontSize: '1rem',
                    lineHeight: '1.6'
                  }}>
                    {selectedItem.description}
                  </p>
                </div>
              )}

              {/* Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: items.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: items.length === 1 ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)' : 'var(--background)',
                  padding: items.length === 1 ? '24px' : '16px',
                  borderRadius: '12px',
                  border: items.length === 1 ? '2px solid rgba(99, 102, 241, 0.2)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      background: 'var(--primary)',
                      color: 'white',
                      width: items.length === 1 ? '40px' : '32px',
                      height: items.length === 1 ? '40px' : '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Tag size={items.length === 1 ? 24 : 16} />
                    </div>
                    <label style={{
                      fontSize: items.length === 1 ? '1rem' : '0.75rem',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {t('common.category')}
                    </label>
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: items.length === 1 ? '1.75rem' : '1rem', 
                    fontWeight: 700, 
                    color: '#1a1a1a',
                    lineHeight: '1.2'
                  }}>
                    {selectedItem.category.name}
                  </p>
                </div>

                <div style={{
                  background: items.length === 1 ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' : 'var(--background)',
                  padding: items.length === 1 ? '24px' : '16px',
                  borderRadius: '12px',
                  border: items.length === 1 ? '2px solid rgba(16, 185, 129, 0.2)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      background: 'var(--success)',
                      color: 'white',
                      width: items.length === 1 ? '40px' : '32px',
                      height: items.length === 1 ? '40px' : '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <MapPin size={items.length === 1 ? 24 : 16} />
                    </div>
                    <label style={{
                      fontSize: items.length === 1 ? '1rem' : '0.75rem',
                      fontWeight: 700,
                      color: 'var(--success)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {t('common.location')}
                    </label>
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: items.length === 1 ? '1.75rem' : '1rem', 
                    fontWeight: 700, 
                    color: '#1a1a1a',
                    lineHeight: '1.2'
                  }}>
                    {selectedItem.location.name}
                  </p>
                </div>

                <div style={{
                  background: items.length === 1 ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)' : 'var(--background)',
                  padding: items.length === 1 ? '24px' : '16px',
                  borderRadius: '12px',
                  border: items.length === 1 ? '2px solid rgba(245, 158, 11, 0.2)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      background: 'var(--warning)',
                      color: 'white',
                      width: items.length === 1 ? '40px' : '32px',
                      height: items.length === 1 ? '40px' : '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: items.length === 1 ? '1.5rem' : '1rem',
                      fontWeight: 'bold'
                    }}>
                      #
                    </div>
                    <label style={{
                      fontSize: items.length === 1 ? '1rem' : '0.75rem',
                      fontWeight: 700,
                      color: 'var(--warning)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {selectedItem.unitType === 'BOX' ? t('dashboard.units') : t('common.quantity')}
                    </label>
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: items.length === 1 ? '2.5rem' : '1.5rem', 
                    fontWeight: 700, 
                    color: '#1a1a1a',
                    lineHeight: '1'
                  }}>
                    {((selectedItem.unitType === 'BOX' || selectedItem.unitsPerBox) && selectedItem.unitsPerBox && typeof selectedItem.unitsPerBox === 'number')
                      ? `${selectedItem.totalUnits || (selectedItem.quantity * selectedItem.unitsPerBox)} units - ${selectedItem.quantity} box`
                      : selectedItem.quantity
                    }
                  </p>
                </div>

                {selectedItem.barcode && (
                  <div style={{
                    background: 'var(--background)',
                    padding: '16px',
                    borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <BarcodeIcon size={16} style={{ color: 'var(--text-secondary)' }} />
                      <label style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase'
                      }}>
                        {t('common.barcode')}
                      </label>
                    </div>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace' }}>
                      {selectedItem.barcode}
                    </p>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              {(selectedItem.sku || selectedItem.siteKitSku || selectedItem.unitType === 'BOX') && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  {selectedItem.sku && (
                    <div>
                      <label style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        marginBottom: '4px',
                        display: 'block'
                      }}>
                        SKU
                      </label>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', fontFamily: 'monospace' }}>
                        {selectedItem.sku}
                      </p>
                    </div>
                  )}

                  {selectedItem.siteKitSku && (
                    <div>
                      <label style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        marginBottom: '4px',
                        display: 'block'
                      }}>
                        Site Kit SKU
                      </label>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', fontFamily: 'monospace' }}>
                        {selectedItem.siteKitSku}
                      </p>
                    </div>
                  )}

                  {selectedItem.unitType === 'BOX' && selectedItem.unitsPerBox && (
                    <>
                      <div>
                        <label style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                          display: 'block'
                        }}>
                          {t('newItem.unitsPerBox')}
                        </label>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                          {selectedItem.unitsPerBox}
                        </p>
                      </div>
                      <div>
                        <label style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                          display: 'block'
                        }}>
                          {t('newItem.totalUnits')}
                        </label>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                          {selectedItem.totalUnits || (selectedItem.quantity * selectedItem.unitsPerBox)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Serial Numbers */}
              {selectedItem.serialNumbers && selectedItem.serialNumbers.length > 0 && (
                <div style={{
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <label style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '12px',
                    display: 'block'
                  }}>
                    🔢 {t('serialNumbers.title')} ({selectedItem.serialNumbers.length})
                  </label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedItem.serialNumbers.map((sn, i) => (
                      <div key={sn.id} style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '8px 0',
                        borderBottom: i < selectedItem.serialNumbers.length - 1 ? '1px solid rgba(99, 102, 241, 0.1)' : 'none',
                        fontSize: '0.85rem'
                      }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, minWidth: '24px' }}>#{i + 1}</span>
                        {sn.serialNumber && <span style={{ fontFamily: 'monospace' }}>SN: {sn.serialNumber}</span>}
                        {sn.tmoSerial && <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>TMO: {sn.tmoSerial}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Link
                href={`/items/${selectedItem.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px 24px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Edit size={20} />
                {t('itemDetails.editItem')}
              </Link>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    </div>
  )
}
