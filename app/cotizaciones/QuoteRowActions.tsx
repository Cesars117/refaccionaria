'use client'

import { Trash2, Check, X, Eye } from 'lucide-react'
import { updateQuoteStatus, deleteQuote } from '@/app/actions'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function QuoteRowActions({ quoteId, status }: { quoteId: string, status: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAction = (newStatus: string) => {
    const formData = new FormData()
    formData.append('id', quoteId)
    formData.append('status', newStatus)
    
    startTransition(async () => {
      await updateQuoteStatus(formData)
      router.refresh()
    })
  }

  const handleDelete = () => {
    const formData = new FormData()
    formData.append('id', quoteId)
    
    startTransition(async () => {
      await deleteQuote(formData)
      setDeletingId(null)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {status === 'PENDING' && !deletingId && (
        <>
          <button 
            onClick={() => handleAction('SOLD')}
            disabled={isPending}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50" 
            title="Aprobar (Venta)"
          >
            <Check size={16} />
          </button>
          <button 
            onClick={() => handleAction('CANCELLED')}
            disabled={isPending}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50" 
            title="Cancelar"
          >
            <X size={16} />
          </button>
        </>
      )}

      {!deletingId ? (
        <>
          <Link 
            href={`/cotizaciones/${quoteId}`} 
            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors" 
            title="Ver detalles / Editar"
          >
            <Eye size={16} />
          </Link>
          <button 
            onClick={() => setDeletingId(quoteId)}
            disabled={isPending}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50" 
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </>
      ) : (
        <div className="flex items-center gap-1 animate-in fade-in zoom-in-95">
          <button 
            onClick={handleDelete}
            disabled={isPending}
            className="text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? '...' : 'SÍ'}
          </button>
          <button 
            onClick={() => setDeletingId(null)}
            disabled={isPending}
            className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            NO
          </button>
        </div>
      )}
    </div>
  )
}
