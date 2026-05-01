'use client'

import { deleteCategory, deleteLocation } from '@/app/actions'

interface DeleteButtonProps {
  id: number
  type: 'category' | 'location'
  partsCount?: number
}

export function DeleteButton({ id, type, partsCount = 0 }: DeleteButtonProps) {
  const action = type === 'category' ? deleteCategory : deleteLocation
  
  const handleSubmit = (e: React.FormEvent) => {
    if (partsCount > 0) {
      alert(`No se puede eliminar: esta ${type === 'category' ? 'categoría' : 'ubicación'} tiene ${partsCount} partes asignadas. Debe mover o eliminar las partes primero.`);
      e.preventDefault();
      return;
    }
    
    const message = type === 'category' 
      ? '¿Estás seguro de eliminar esta categoría?' 
      : '¿Estás seguro de eliminar esta ubicación?';
      
    if (!confirm(message)) {
      e.preventDefault();
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs text-red-500 hover:text-red-700">
        Eliminar
      </button>
    </form>
  )
}
