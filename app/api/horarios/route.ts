import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    if (!adminId) return NextResponse.json({ error: 'adminId requerido' }, { status: 400 });

    const horarios = await prisma.horarioSemanal.findMany({
      where: { adminId },
      orderBy: { dayOfWeek: 'asc' }
    });
    return NextResponse.json(horarios, { status: 200 });
  } catch (error) {
    console.error('Error GET horarios:', error);
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { adminId, horarios } = data; // horarios is an array of { dayOfWeek, startTime, endTime }

    if (!adminId || !Array.isArray(horarios)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Delete existing and recreate
    await prisma.horarioSemanal.deleteMany({
      where: { adminId }
    });

    const newHorarios = await prisma.$transaction(
      horarios.map(h => prisma.horarioSemanal.create({
        data: {
          adminId,
          dayOfWeek: Number(h.dayOfWeek),
          startTime: h.startTime,
          endTime: h.endTime
        }
      }))
    );

    return NextResponse.json(newHorarios, { status: 200 });
  } catch (error) {
    console.error('Error PUT horarios:', error);
    return NextResponse.json({ error: 'Error al actualizar horarios' }, { status: 500 });
  }
}
