import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addDays, startOfDay, endOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function GET(req: Request) {
  try {
    // Only allow via cron secret or internal call
    // (Optional security check here)

    const tomorrow = addDays(new Date(), 1);
    const startOfTomorrow = startOfDay(tomorrow);
    const endOfTomorrow = endOfDay(tomorrow);

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
        const diaStr = format(tomorrow, "EEEE", { locale: es });
        const primerTurnoHora = format(new Date(turnos[0].startTime), "HH:mm");
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
