'use client'

import { useLanguage } from '@/app/contexts/LanguageContext'
import { Globe } from 'lucide-react'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        background: 'white',
        color: 'var(--text)',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'var(--background)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'white'
      }}
      title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
    >
      <Globe size={18} />
      <span>{language === 'en' ? '🇺🇸 EN' : '🇲🇽 ES'}</span>
    </button>
  )
}
