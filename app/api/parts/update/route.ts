import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { notifyTiendaOfUpdate } from '@/app/lib/tienda-sync';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageInventory } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!canManageInventory(session?.user?.role)) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    const data = await req.json();
    const { id, name, sku, brand, oemNumber, price, quantity, categoryId, locationId, description } = data;

    if (!id || !name) {
      return NextResponse.json({ success: false, error: 'ID y Nombre son obligatorios' }, { status: 400 });
    }

    // Usar Prisma para máxima compatibilidad con SQLite y MariaDB
    await db.part.update({
      where: { id: parseInt(id) },
      data: {
        name,
        sku: sku || null,
        brand: brand || null,
        oemNumber: oemNumber || null,
        price: parseFloat(price) || 0,
        quantity: parseInt(quantity) || 0,
        categoryId: parseInt(categoryId) || 1,
        locationId: parseInt(locationId) || 1,
        description: description || null,
      }
    });

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
