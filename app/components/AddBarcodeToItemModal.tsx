'use client'

import { useState } from 'react'
import { Search, X, Package, Check } from 'lucide-react'
import { useLanguage } from '@/app/contexts/LanguageContext'

interface Item {
  id: number
  name: string
  barcode: string | null
  quantity: number
  status: string
  category: { name: string }
  location: { name: string }
}

interface AddBarcodeToItemModalProps {
  barcode: string
  items: Item[]
  onClose: () => void
  onSelectItem: (itemId: number) => Promise<void>
}

export function AddBarcodeToItemModal({ barcode, items, onClose, onSelectItem }: AddBarcodeToItemModalProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async () => {
    if (selectedItemId === null) return

    setIsSubmitting(true)
    try {
      await onSelectItem(selectedItemId)
      onClose()
    } catch (error) {
      console.error('Error adding barcode:', error)
      alert('Error adding barcode. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1002,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text)' }}>
              {t('addBarcodeModal.title')}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={24} />
            </button>
          </div>
          <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {t('addBarcodeModal.codeToAssign')}: <strong>{barcode}</strong>
          </p>

          {/* Search Bar */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-secondary)'
              }}
            />
            <input
              type="text"
              placeholder={t('addBarcodeModal.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {/* Items List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '20px',
          border: '1px solid var(--border)',
          borderRadius: '8px'
        }}>
          {filteredItems.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <Package size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                {t('addBarcodeModal.noItems')}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: selectedItemId === item.id ? 'var(--primary-light)' : 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>
                      {item.name}
                    </h3>
                    {item.barcode && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--warning)',
                        background: 'var(--warning-light)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {t('addBarcodeModal.hasCode')}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>📦 {item.category.name}</span>
                    <span>📍 {item.location.name}</span>
                    <span>Quantity: {item.quantity}</span>
                  </div>
                </div>
                {selectedItemId === item.id && (
                  <div style={{
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
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'white',
              color: 'var(--text)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.5 : 1
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedItemId === null || isSubmitting}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              background: selectedItemId === null ? 'var(--border)' : 'var(--primary)',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: selectedItemId === null || isSubmitting ? 'not-allowed' : 'pointer',
              opacity: selectedItemId === null || isSubmitting ? 0.5 : 1
            }}
          >
            {isSubmitting ? t('common.saving') : t('addBarcodeModal.assign')}
          </button>
        </div>
      </div>
    </div>
  )
}
