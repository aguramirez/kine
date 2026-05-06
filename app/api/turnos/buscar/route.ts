import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/turnos/buscar?dni=12345678
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dni = searchParams.get('dni');

    if (!dni) {
      return NextResponse.json({ error: 'DNI requerido' }, { status: 400 });
    }

    const paciente = await prisma.paciente.findUnique({ where: { dni } });

    if (!paciente) {
      return NextResponse.json({ error: 'No se encontró un paciente con ese DNI' }, { status: 404 });
    }

    const turnos = await prisma.turno.findMany({
      where: {
        pacienteId: paciente.id,
        status: { not: 'CANCELLED' }
      },
      include: {
        admin: { select: { fullName: true } }
      },
      orderBy: { startTime: 'asc' }
    });

    return NextResponse.json({
      paciente: { id: paciente.id, fullName: paciente.fullName },
      turnos
    }, { status: 200 });
  } catch (error) {
    console.error('Error buscar turnos:', error);
    return NextResponse.json({ error: 'Error al buscar turnos' }, { status: 500 });
  }
}
