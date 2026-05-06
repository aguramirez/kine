import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    if (!adminId) return NextResponse.json({ error: 'adminId requerido' }, { status: 400 });

    const excepciones = await prisma.excepcionHorario.findMany({
      where: { adminId },
      orderBy: { date: 'asc' }
    });
    return NextResponse.json(excepciones, { status: 200 });
  } catch (error) {
    console.error('Error GET excepciones:', error);
    return NextResponse.json({ error: 'Error al obtener excepciones' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { adminId, date, isClosed, startTime, endTime } = data;

    if (!adminId || !date) {
      return NextResponse.json({ error: 'adminId y date requeridos' }, { status: 400 });
    }

    const newExcepcion = await prisma.excepcionHorario.create({
      data: {
        adminId,
        date: new Date(date),
        isClosed: Boolean(isClosed),
        startTime: startTime || null,
        endTime: endTime || null
      }
    });

    return NextResponse.json(newExcepcion, { status: 201 });
  } catch (error) {
    console.error('Error POST excepcion:', error);
    return NextResponse.json({ error: 'Error al crear excepcion' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    await prisma.excepcionHorario.delete({
      where: { id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error DELETE excepcion:', error);
    return NextResponse.json({ error: 'Error al eliminar excepcion' }, { status: 500 });
  }
}
