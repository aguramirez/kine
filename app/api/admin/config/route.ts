import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    if (!adminId) return NextResponse.json({ error: 'adminId requerido' }, { status: 400 });

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { phone: true, slotDuration: true }
    });

    if (!admin) return NextResponse.json({ error: 'Admin no encontrado' }, { status: 404 });

    return NextResponse.json(admin, { status: 200 });
  } catch (error) {
    console.error('Error GET admin config:', error);
    return NextResponse.json({ error: 'Error al obtener config' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { adminId, phone, slotDuration } = data;

    if (!adminId) return NextResponse.json({ error: 'adminId requerido' }, { status: 400 });

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: { 
        phone: phone || null,
        slotDuration: slotDuration ? Number(slotDuration) : 45
      },
      select: { phone: true, slotDuration: true }
    });

    return NextResponse.json(admin, { status: 200 });
  } catch (error) {
    console.error('Error PUT admin config:', error);
    return NextResponse.json({ error: 'Error al actualizar config' }, { status: 500 });
  }
}
