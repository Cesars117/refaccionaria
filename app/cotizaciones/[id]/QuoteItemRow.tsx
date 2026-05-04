'use client'

import { useState, useTransition } from 'react'
import { updateQuoteItem, removeQuoteItem } from '@/app/actions'
import { formatCurrency } from '@/lib/utils'
import { Edit2, Trash2, Save, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function QuoteItemRow({ 
  item, 
  isOpen 
}: { 
  item: any, 
  isOpen: boolean 
}) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    quantity: item.quantity,
    unitPrice: item.unitPrice
  })

  const handleUpdate = () => {
    const fd = new FormData()
    fd.append('id', item.id)
    fd.append('quantity', String(formData.quantity))
    fd.append('unitPrice', String(formData.unitPrice))
    
    startTransition(async () => {
      await updateQuoteItem(fd)
      setIsEditing(false)
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (!confirm('¿Quitar este item?')) return
    const fd = new FormData()
    fd.append('id', item.id)
    startTransition(async () => {
      await removeQuoteItem(fd)
      router.refresh()
    })
  }

  if (isEditing) {
    return (
      <tr className="bg-brand-50/50">
        <td className="px-4 py-2 text-sm text-gray-900 font-medium">
          {item.description}
        </td>
        <td className="px-3 py-2">
          <input 
            type="number" 
            value={formData.quantity} 
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            className="w-16 text-right text-sm border-gray-200 rounded focus:ring-brand-500"
          />
        </td>
        <td className="px-3 py-2">
          <input 
            type="number" 
            step="0.01"
            value={formData.unitPrice} 
            onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
            className="w-24 text-right text-sm border-gray-200 rounded focus:ring-brand-500"
          />
        </td>
        <td className="px-3 py-2 text-right text-sm font-bold text-brand-700">
          {formatCurrency(formData.quantity * formData.unitPrice)}
        </td>
        <td className="px-3 py-2 text-right">
          <div className="flex justify-end gap-1">
            <button 
              onClick={handleUpdate}
              disabled={isPending}
              className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
            >
              <Save size={16} />
            </button>
            <button 
              onClick={() => setIsEditing(false)}
              className="p-1 text-gray-400 hover:bg-gray-100 rounded"
            >
              <X size={16} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-gray-50 group">
      <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
      <td className="px-3 py-2 text-right text-sm">{item.quantity}</td>
      <td className="px-3 py-2 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
      <td className="px-3 py-2 text-right text-sm font-medium">{formatCurrency(item.amount)}</td>
      {isOpen && (
        <td className="px-3 py-2 text-right">
          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded"
              title="Editar item"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={handleDelete}
              disabled={isPending}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
              title="Quitar item"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      )}
    </tr>
  )
}
