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

    if (type === 'category' && partsCount > 0) {
      alert(`No se puede eliminar: esta categoría tiene ${partsCount} partes asignadas.`);
      return
    }

    if (type === 'location' && partsCount > 0) {
      if (confirm(`Esta ubicación tiene ${partsCount} partes asignadas.\n\n¿Desea ELIMINAR permanentemente todas las partes asignadas junto con la ubicación?`)) {
        startTransition(async () => {
          try {
            const formData = new FormData()
            formData.append('id', id.toString())
            formData.append('deleteParts', 'true')
            const result = await deleteLocation(formData)
            if (result && !result.success) {
              alert('No se pudo eliminar: ' + (result.error || 'Error desconocido'));
            } else {
              alert('Ubicación y sus partes eliminadas con éxito');
              router.refresh();
            }
          } catch (error) {
            alert('Error al procesar la solicitud.');
          }
        })
        return
      } else if (confirm(`¿Desea TRANSFERIR las ${partsCount} partes al 'Almacen General' y después eliminar la ubicación?`)) {
        startTransition(async () => {
          try {
            const formData = new FormData()
            formData.append('id', id.toString())
            formData.append('transferParts', 'true')
            const result = await deleteLocation(formData)
            if (result && !result.success) {
              alert('No se pudo completar: ' + (result.error || 'Error desconocido'));
            } else {
              alert('Partes transferidas a Almacen General y ubicación eliminada con éxito');
              router.refresh();
            }
          } catch (error) {
            alert('Error al procesar la solicitud.');
          }
        })
        return
      }
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
        } else if (result && result.success) {
          alert('Eliminado con éxito');
          if (type === 'part') {
            router.push('/partes');
          }
          router.refresh();
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
