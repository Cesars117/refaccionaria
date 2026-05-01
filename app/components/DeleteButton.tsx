'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCategory, deleteLocation, deletePart } from '@/app/actions'

interface DeleteButtonProps {
  id: number | string
  type: 'category' | 'location' | 'part'
  partsCount?: number
}

export function DeleteButton({ id, type, partsCount = 0 }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()

    if (type !== 'part' && partsCount > 0) {
      alert(`No se puede eliminar: esta ${type === 'category' ? 'categoría' : 'ubicación'} tiene ${partsCount} partes asignadas.`);
      return
    }

    const message = type === 'part' 
      ? '¿Eliminar esta parte permanentemente?' 
      : `¿Eliminar esta ${type === 'category' ? 'categoría' : 'ubicación'}?`

    if (!confirm(message)) return

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('id', id.toString())
        
        let result: any
        if (type === 'category') result = await deleteCategory(formData)
        else if (type === 'location') result = await deleteLocation(formData)
        else if (type === 'part') result = await deletePart(formData)

        if (result && !result.success) {
          alert('No se pudo eliminar: ' + (result.error || 'Error desconocido'));
        } else if (type === 'part') {
          router.push('/partes')
          router.refresh()
        }
      } catch (error) {
        alert('Error al eliminar. Intente de nuevo.')
      }
    })
  }

  return (
    <form onSubmit={handleDelete}>
      <button 
        type="submit" 
        disabled={isPending}
        className={`text-xs font-semibold ${isPending ? 'text-gray-400' : 'text-red-500 hover:text-red-700'}`}
      >
        {isPending ? 'Eliminando...' : 'Eliminar'}
      </button>
    </form>
  )
}
