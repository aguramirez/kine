import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { format, parse, addMinutes, isBefore, isAfter, isSameDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const dateStr = searchParams.get('date'); // YYYY-MM-DD

    if (!adminId || !dateStr) {
      return NextResponse.json({ error: 'adminId y date requeridos' }, { status: 400 });
    }

    const [year, month, day] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const dayOfWeek = date.getDay(); // Local day of week

    const [admin, baseSchedules, exception, turnos] = await Promise.all([
      prisma.admin.findUnique({ where: { id: adminId } }),
      prisma.horarioSemanal.findMany({ where: { adminId, dayOfWeek } }),
      prisma.excepcionHorario.findFirst({
        where: { 
          adminId,
          date: {
            gte: new Date(dateStr + "T00:00:00.000Z"),
            lte: new Date(dateStr + "T23:59:59.999Z")
          }
        }
      }),
      prisma.turno.findMany({
        where: {
          adminId,
          status: { not: 'CANCELLED' },
          date: {
            gte: new Date(dateStr + "T00:00:00.000Z"),
            lte: new Date(dateStr + "T23:59:59.999Z")
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
      let currentSlot = parse(range.start, 'HH:mm', date);
      const endTime = parse(range.end, 'HH:mm', date);

      while (addMinutes(currentSlot, slotDuration) <= endTime) {
        availableSlots.push(new Date(currentSlot));
        currentSlot = addMinutes(currentSlot, slotDuration);
      }
    }

    // Filter out occupied slots
    const occupiedTimesStr = turnos.map(t => format(new Date(t.startTime), 'HH:mm'));
    availableSlots = availableSlots.filter(slot => !occupiedTimesStr.includes(format(slot, 'HH:mm')));

    // Ensure we don't return past slots if today
    const now = new Date();
    availableSlots = availableSlots.filter(slot => isAfter(slot, now));

    return NextResponse.json(availableSlots.map(s => s.toISOString()), { status: 200 });
  } catch (error) {
    console.error('Error GET turnos disponibles:', error);
    return NextResponse.json({ error: 'Error al obtener disponibilidad' }, { status: 500 });
  }
}
