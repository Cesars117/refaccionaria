'use client'

import { useState } from 'react'
import { updateQuote } from '@/app/actions'
import { Edit2, Save, X, User, Car, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Customer {
  id: string
  name: string
}

export default function QuoteHeader({ 
  quote, 
  customers 
}: { 
  quote: any, 
  customers: Customer[] 
}) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isEditing) {
    return (
      <div className="group relative">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{quote.quoteNumber}</h1>
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Editar encabezado"
          >
            <Edit2 size={16} />
          </button>
        </div>
        <div className="mt-1 space-y-1">
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <User size={14} className="text-gray-400" />
            <span className="font-medium text-gray-900">{quote.customer.name}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">{new Date(quote.createdAt).toLocaleDateString('es-MX')}</span>
          </p>
          {quote.vehicleRef && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Car size={14} className="text-gray-400" />
              {quote.vehicleRef}
            </p>
          )}
          {quote.notes && (
            <p className="text-sm text-gray-500 flex items-center gap-2 italic">
              <FileText size={14} className="text-gray-400" />
              &quot;{quote.notes}&quot;
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <form 
      action={async (fd) => {
        setLoading(true)
        await updateQuote(fd)
        setIsEditing(false)
        setLoading(false)
        router.refresh()
      }}
      className="bg-brand-50 p-4 rounded-xl border border-brand-100 space-y-3 animate-in fade-in slide-in-from-top-2"
    >
      <input type="hidden" name="id" value={quote.id} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-brand-700 uppercase ml-1">Cliente</label>
          <select name="customerId" defaultValue={quote.customerId} className="w-full text-sm border-gray-200 rounded-lg focus:ring-brand-500 focus:border-brand-500">
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-brand-700 uppercase ml-1">Vehículo (Referencia)</label>
          <input 
            name="vehicleRef" 
            defaultValue={quote.vehicleRef || ''} 
            className="w-full text-sm border-gray-200 rounded-lg focus:ring-brand-500 focus:border-brand-500"
            placeholder="Ej: Nissan Sentra 2018"
          />
        </div>
      </div>
      
      <div>
        <label className="text-[10px] font-bold text-brand-700 uppercase ml-1">Notas / Observaciones</label>
        <textarea 
          name="notes" 
          defaultValue={quote.notes || ''} 
          rows={2}
          className="w-full text-sm border-gray-200 rounded-lg focus:ring-brand-500 focus:border-brand-500"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button 
          type="button" 
          onClick={() => setIsEditing(false)}
          className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1"
        >
          <X size={14} /> Cancelar
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="px-3 py-1.5 text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 rounded-lg flex items-center gap-1 disabled:opacity-50"
        >
          {loading ? '...' : <><Save size={14} /> Guardar Cambios</>}
        </button>
      </div>
    </form>
  )
}
