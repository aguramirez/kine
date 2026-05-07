import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getArgentinaDayRange } from '@/lib/date-utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const whereAdmin = adminId ? { adminId } : {};

    // Pacientes activos
    const activePacientes = await prisma.paciente.count({
      where: { isActive: true, ...whereAdmin },
    });

    // Sesiones de hoy: pacientes que hicieron click en "Finalizar sesión" hoy in Argentina
    const { start: todayStart, end: todayEnd } = getArgentinaDayRange();

    const sessionsToday = await prisma.paciente.count({
      where: {
        lastSessionDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        ...whereAdmin,
      },
    });

    // Pacientes recientes (últimos 10)
    const recentPacientes = await prisma.paciente.findMany({
      where: whereAdmin,
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        dni: true,
        diagnoses: true,
        isActive: true,
        sessionsCount: true,
        totalSessions: true,
        createdAt: true,
      },
    });

    // Total de pacientes
    const totalPacientes = await prisma.paciente.count({
      where: whereAdmin,
    });

    return NextResponse.json({
      activePacientes,
      sessionsToday,
      totalPacientes,
      recentPacientes,
    }, { status: 200 });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}

