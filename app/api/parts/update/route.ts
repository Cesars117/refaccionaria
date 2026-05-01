import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { notifyTiendaOfUpdate } from '@/app/lib/tienda-sync';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, name, sku, brand, oemNumber, price, quantity, categoryId, locationId, description } = data;

    if (!id || !name) {
      return NextResponse.json({ success: false, error: 'ID y Nombre son obligatorios' }, { status: 400 });
    }

    // Usar SQL puro para máxima compatibilidad
    await db.$executeRawUnsafe(
      `UPDATE parts SET 
        name=?, sku=?, brand=?, oemNumber=?, price=?, quantity=?, 
        categoryId=?, locationId=?, description=?, 
        updatedAt=datetime('now') 
      WHERE id=?`,
      name, sku || '', brand || '', oemNumber || '', 
      parseFloat(price) || 0, parseInt(quantity) || 0, 
      parseInt(categoryId) || 1, parseInt(locationId) || 1, 
      description || '', parseInt(id)
    );

    // Intentar revalidar (si falla, no importa)
    try {
      revalidatePath('/partes');
    } catch {}

    // Notificar a la tienda de forma asíncrona
    notifyTiendaOfUpdate(parseInt(id)).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API UPDATE ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
