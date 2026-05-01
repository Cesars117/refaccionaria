'use server'

import db from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function updatePartAction(formData: FormData) {
  try {
    const id = parseInt(formData.get('id') as string)
    const name = formData.get('name') as string
    
    if (isNaN(id)) return { success: false, error: 'ID inválido' }

    // Minimal update to test
    await db.$executeRawUnsafe(
      `UPDATE parts SET name=? WHERE id=?`,
      name, id
    )

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error' }
  }
}
