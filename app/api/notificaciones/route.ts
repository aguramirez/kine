import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    if (!adminId) return NextResponse.json({ error: 'adminId requerido' }, { status: 400 });

    const notificaciones = await prisma.notificacion.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    return NextResponse.json(notificaciones, { status: 200 });
  } catch (error) {
    console.error('Error GET notificaciones:', error);
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const data = await req.json();
    const { adminId } = data; // Mark all as read for admin

    if (!adminId) {
      return NextResponse.json({ error: 'adminId requerido' }, { status: 400 });
    }

    await prisma.notificacion.updateMany({
      where: { adminId, isRead: false },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error PATCH notificaciones:', error);
    return NextResponse.json({ error: 'Error al actualizar notificaciones' }, { status: 500 });
  }
}
