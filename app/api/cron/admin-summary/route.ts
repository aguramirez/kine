import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addDays } from 'date-fns';
import { getArgentinaDayRange, formatInArgentina, getNowInArgentina } from '@/lib/date-utils';

export async function GET(req: Request) {
  try {
    // We want the range for tomorrow in Argentina
    const tomorrow = addDays(getNowInArgentina(), 1);
    const { start: startOfTomorrow, end: endOfTomorrow } = getArgentinaDayRange(tomorrow.toISOString().split('T')[0]);

    const admins = await prisma.admin.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true }
    });

    const summaries = [];

    for (const admin of admins) {
      const turnos = await prisma.turno.findMany({
        where: {
          adminId: admin.id,
          date: { gte: startOfTomorrow, lte: endOfTomorrow },
          status: 'CONFIRMED'
        },
        include: { paciente: { select: { fullName: true } } },
        orderBy: { startTime: 'asc' }
      });

      if (turnos.length > 0) {
        const diaStr = formatInArgentina(tomorrow, "EEEE");
        const primerTurnoHora = formatInArgentina(turnos[0].startTime, "HH:mm");
        const message = `¡Hola! Mañana ${diaStr} tenés ${turnos.length} ${turnos.length === 1 ? 'turno' : 'turnos'}, el primero a las ${primerTurnoHora}hs.`;
        
        summaries.push({
          adminPhone: admin.phone,
          message
        });
      }
    }

    return NextResponse.json(summaries, { status: 200 });
  } catch (error) {
    console.error('Cron Admin Summary Error:', error);
    return NextResponse.json({ error: 'Error generating summaries' }, { status: 500 });
  }
}

