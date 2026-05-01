'use server'

import db from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function updatePartAction(formData: FormData) {
  try {
    const id = parseInt(formData.get('id') as string)
    const name = formData.get('name') as string
    const categoryId = parseInt(formData.get('categoryId') as string) || 1
    const locationId = parseInt(formData.get('locationId') as string) || 1
    const quantity = parseInt(formData.get('quantity') as string || '0')
    const minStock = parseInt(formData.get('minStock') as string || '0')
    const price = parseFloat(formData.get('price') as string || '0')
    const cost = parseFloat(formData.get('cost') as string || '0')
    const brand = (formData.get('brand') as string) || ''
    const sku = (formData.get('sku') as string) || ''
    const oemNumber = (formData.get('oemNumber') as string) || ''
    const description = (formData.get('description') as string) || ''

    if (isNaN(id)) return { success: false, error: 'ID de parte inválido' }

    // Use a very safe SQL update
    await db.$executeRawUnsafe(
      `UPDATE parts SET name=?, categoryId=?, locationId=?, quantity=?, minStock=?, price=?, cost=?, brand=?, sku=?, oemNumber=?, description=?, updatedAt=datetime('now') WHERE id=?`,
      name, categoryId, locationId, quantity, minStock, price, cost, brand, sku, oemNumber, description, id
    )

    revalidatePath('/partes')
    return { success: true }
  } catch (err: any) {
    console.error('CRITICAL UPDATE ERROR:', err)
    return { success: false, error: err.message || 'Error desconocido' }
  }
}
