import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Pacientes activos
    const activePacientes = await prisma.paciente.count({
      where: { isActive: true },
    });

    // Sesiones de hoy: pacientes que hicieron click en "Finalizar sesión" hoy
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const sessionsToday = await prisma.paciente.count({
      where: {
        lastSessionDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // Pacientes recientes (últimos 10)
    const recentPacientes = await prisma.paciente.findMany({
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
    const totalPacientes = await prisma.paciente.count();

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
