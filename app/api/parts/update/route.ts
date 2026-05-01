import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, name } = data;

    if (!id || !name) {
      return NextResponse.json({ success: false, error: 'ID y Nombre son obligatorios' }, { status: 400 });
    }

    // Usar SQL puro para máxima compatibilidad
    await db.$executeRawUnsafe(
      `UPDATE parts SET name=? WHERE id=?`,
      name, parseInt(id)
    );

    // Intentar revalidar (si falla, no importa)
    try {
      revalidatePath('/partes');
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API UPDATE ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
