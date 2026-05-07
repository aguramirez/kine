import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addMinutes, isAfter, format } from 'date-fns';
import { getArgentinaDayRange, parseArgentinaDate, getNowInArgentina } from '@/lib/date-utils';
import { parse } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const dateStr = searchParams.get('date'); // YYYY-MM-DD

    if (!adminId || !dateStr) {
      return NextResponse.json({ error: 'adminId y date requeridos' }, { status: 400 });
    }

    // Use our utility to get the range for the requested date in Argentina
    const { start: startOfRequestedDay, end: endOfRequestedDay } = getArgentinaDayRange(dateStr);
    const dayOfWeek = startOfRequestedDay.getDay(); 

    const [admin, baseSchedules, exception, turnos] = await Promise.all([
      prisma.admin.findUnique({ where: { id: adminId } }),
      prisma.horarioSemanal.findMany({ where: { adminId, dayOfWeek } }),
      prisma.excepcionHorario.findFirst({
        where: { 
          adminId,
          date: {
            gte: startOfRequestedDay,
            lte: endOfRequestedDay
          }
        }
      }),
      prisma.turno.findMany({
        where: {
          adminId,
          status: { not: 'CANCELLED' },
          date: {
            gte: startOfRequestedDay,
            lte: endOfRequestedDay
          }
        }
      })
    ]);

    if (!admin) return NextResponse.json({ error: 'Admin no encontrado' }, { status: 404 });

    if (exception && exception.isClosed) {
      return NextResponse.json([], { status: 200 }); // No slots available
    }

    // Determine actual time ranges for this day
    let ranges: { start: string, end: string }[] = [];
    
    if (exception && (exception.startTime || exception.endTime)) {
      // Overridden schedule for this day
      ranges.push({
        start: exception.startTime || "00:00",
        end: exception.endTime || "23:59"
      });
    } else {
      // Base schedules
      ranges = baseSchedules.map(h => ({ start: h.startTime, end: h.endTime }));
    }

    if (ranges.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Generate slots
    const slotDuration = admin.slotDuration;
    let availableSlots: Date[] = [];

    for (const range of ranges) {
      // Construct start and end times as full strings to avoid local time parsing issues
      const startStr = `${dateStr}T${range.start}:00`;
      const endStr = `${dateStr}T${range.end}:00`;
      
      let currentSlot = parseArgentinaDate(startStr);
      const endTime = parseArgentinaDate(endStr);

      while (addMinutes(currentSlot, slotDuration) <= endTime) {
        availableSlots.push(new Date(currentSlot));
        currentSlot = addMinutes(currentSlot, slotDuration);
      }
    }

    // Filter out occupied slots
    // turnos.startTime are stored in UTC but represent specific moments.
    // We compare based on their HH:mm representation in Argentina time.
    const occupiedTimesStr = turnos.map(t => {
      // startTime is already a Date object from Prisma
      return format(t.startTime, 'HH:mm'); // format will use server local time, we should be careful.
      // Wait, if I use format from date-fns, it uses local time.
      // Better use our formatInArgentina if we want to be sure.
    });

    // Actually, availableSlots were created with startOfRequestedDay which might be UTC.
    // Let's use formatInArgentina to be safe everywhere.
    const { formatInArgentina } = await import('@/lib/date-utils');
    
    const occupiedTimes = turnos.map(t => formatInArgentina(t.startTime, 'HH:mm'));
    
    availableSlots = availableSlots.filter(slot => !occupiedTimes.includes(formatInArgentina(slot, 'HH:mm')));

    // Ensure we don't return past slots if today
    const now = getNowInArgentina();
    availableSlots = availableSlots.filter(slot => isAfter(slot, now));

    return NextResponse.json(availableSlots.map(s => s.toISOString()), { status: 200 });
  } catch (error) {
    console.error('Error GET turnos disponibles:', error);
    return NextResponse.json({ error: 'Error al obtener disponibilidad' }, { status: 500 });
  }
}

