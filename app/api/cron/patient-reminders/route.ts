import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getArgentinaDayRange, formatInArgentina } from '@/lib/date-utils';

export async function GET(req: Request) {
  try {
    // Get the current day range in Argentina
    const { start: startOfToday, end: endOfToday } = getArgentinaDayRange();

    const turnos = await prisma.turno.findMany({
      where: {
        date: { gte: startOfToday, lte: endOfToday },
        status: 'CONFIRMED'
      },
      include: {
        paciente: { select: { phone: true, fullName: true } },
        admin: { select: { fullName: true } }
      }
    });

    const reminders = [];

    for (const turno of turnos) {
      if (turno.paciente.phone) {
        const horaTurno = formatInArgentina(turno.startTime, "HH:mm");
        const message = `¡Hola ${turno.paciente.fullName}!\nTe recuerdo que tenés un turno hoy a las ${horaTurno} hs con el Lic. ${turno.admin.fullName}.`;
        
        reminders.push({
          patientPhone: turno.paciente.phone,
          message
        });
      }
    }

    return NextResponse.json(reminders, { status: 200 });
  } catch (error) {
    console.error('Cron Patient Reminders Error:', error);
    return NextResponse.json({ error: 'Error generating reminders' }, { status: 500 });
  }
}

