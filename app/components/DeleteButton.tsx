'use client'

import { deleteCategory, deleteLocation } from '@/app/actions'

interface DeleteButtonProps {
  id: number
  type: 'category' | 'location'
}

export function DeleteButton({ id, type }: DeleteButtonProps) {
  const action = type === 'category' ? deleteCategory : deleteLocation
  const message = type === 'category' 
    ? '¿Estás seguro de eliminar esta categoría? Solo se podrá si no tiene partes asignadas.' 
    : '¿Estás seguro de eliminar esta ubicación? Solo se podrá si no tiene partes asignadas.'

  return (
    <form 
      action={action} 
      onSubmit={(e) => { 
        if (!confirm(message)) {
          e.preventDefault() 
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs text-red-500 hover:text-red-700">
        Eliminar
      </button>
    </form>
  )
}
