import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseArgentinaDate, formatInArgentina } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const pacienteId = searchParams.get('pacienteId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let where: any = {};
    if (adminId) where.adminId = adminId;
    if (pacienteId) where.pacienteId = pacienteId;
    if (startDate && endDate) {
      where.date = {
        gte: parseArgentinaDate(startDate),
        lte: parseArgentinaDate(endDate)
      };
    }

    const turnos = await prisma.turno.findMany({
      where,
      include: {
        paciente: { select: { fullName: true, dni: true, phone: true } },
        admin: { select: { fullName: true } }
      },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json(turnos, { status: 200 });
  } catch (error) {
    console.error('Error GET turnos:', error);
    return NextResponse.json({ error: 'Error al obtener turnos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { adminId, pacienteId, date, startTime, endTime } = data;

    if (!adminId || !pacienteId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const dateParsed = parseArgentinaDate(date);
    const startTimeParsed = parseArgentinaDate(startTime);
    const endTimeParsed = parseArgentinaDate(endTime);

    // Check if slot is already taken
    const existingTurno = await prisma.turno.findFirst({
      where: {
        adminId,
        date: dateParsed,
        startTime: startTimeParsed,
        status: { not: 'CANCELLED' }
      }
    });

    if (existingTurno) {
      return NextResponse.json({ error: 'El horario ya no está disponible' }, { status: 409 });
    }

    const newTurno = await prisma.turno.create({
      data: {
        adminId,
        pacienteId,
        date: dateParsed,
        startTime: startTimeParsed,
        endTime: endTimeParsed,
        status: 'CONFIRMED'
      },
      include: {
        paciente: { select: { fullName: true, dni: true, phone: true } },
        admin: { select: { fullName: true } }
      }
    });

    // Create notification for admin
    await prisma.notificacion.create({
      data: {
        adminId,
        message: `${newTurno.paciente.fullName} ha agendado un turno el ${formatInArgentina(dateParsed, 'dd/MM/yyyy')} a las ${formatInArgentina(startTimeParsed, 'HH:mm')} hs`
      }
    });

    // Trigger WhatsApp bot API call
    try {
      const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || "http://localhost:3000";
      const fechaTurno = formatInArgentina(dateParsed, 'dd/MM/yyyy');
      const horaTurno = formatInArgentina(startTimeParsed, 'HH:mm');

      // Notify Patient
      if (newTurno.paciente.phone) {
        await fetch(`${WHATSAPP_BOT_URL}/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: newTurno.paciente.phone,
            message: `¡Hola ${newTurno.paciente.fullName}!\nAgendaste tu turno el día ${fechaTurno} a las ${horaTurno} con el Lic. ${newTurno.admin.fullName}.\nPodés ver/modificar tu turno acá: https://omegafit.agustindev.com.ar/turnos/buscar\nhasta 24 horas antes de tu turno.`
          })
        });
      }

      // Notify Admin
      const adminData = await prisma.admin.findUnique({ where: { id: adminId } });
      if (adminData && adminData.phone) {
        await fetch(`${WHATSAPP_BOT_URL}/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: adminData.phone,
            message: `¡Nuevo Turno!\n${newTurno.paciente.fullName} ha agendado un turno el ${fechaTurno} a las ${horaTurno}.`
          })
        });
      }
    } catch (botErr) {
      console.error("Error calling WhatsApp bot", botErr);
    }

    return NextResponse.json(newTurno, { status: 201 });
  } catch (error) {
    console.error('Error POST turno:', error);
    return NextResponse.json({ error: 'Error al crear turno' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const turno = await prisma.turno.findUnique({
      where: { id },
      include: { paciente: true, admin: true }
    });

    if (!turno) return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });

    const updatedTurno = await prisma.turno.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Notify Patient & Admin via WhatsApp
    try {
      const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || "http://localhost:3000";
      const fechaTurno = formatInArgentina(turno.date, 'dd/MM/yyyy');
      const horaTurno = formatInArgentina(turno.startTime, 'HH:mm');

      // Notify Patient
      if (turno.paciente.phone) {
        await fetch(`${WHATSAPP_BOT_URL}/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: turno.paciente.phone,
            message: `Hola ${turno.paciente.fullName}, te informamos que tu turno del día ${fechaTurno} a las ${horaTurno} hs con el Lic. ${turno.admin.fullName} ha sido CANCELADO.\nPor favor comunicate para reprogramarlo o agenda de nuevo en: https://omegafit.agustindev.com.ar/turnos/agendar`
          })
        });
      }

      // Notify Admin
      if (turno.admin.phone) {
        await fetch(`${WHATSAPP_BOT_URL}/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: turno.admin.phone,
            message: `❌ Turno Cancelado:\nEl paciente ${turno.paciente.fullName} ha cancelado su turno del día ${fechaTurno} a las ${horaTurno} hs.`
          })
        });
      }
    } catch (botErr) {
      console.error("Error calling WhatsApp bot on cancel", botErr);
    }

    return NextResponse.json(updatedTurno, { status: 200 });
  } catch (error) {
    console.error('Error DELETE turno:', error);
    return NextResponse.json({ error: 'Error al cancelar turno' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, date, startTime, endTime } = data;

    if (!id || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const dateParsed = parseArgentinaDate(date);
    const startTimeParsed = parseArgentinaDate(startTime);
    const endTimeParsed = parseArgentinaDate(endTime);

    const turnoActual = await prisma.turno.findUnique({
      where: { id },
      include: { admin: true, paciente: true }
    });

    if (!turnoActual) return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });

    // Check if new slot is occupied
    const existing = await prisma.turno.findFirst({
      where: {
        adminId: turnoActual.adminId,
        date: dateParsed,
        startTime: startTimeParsed,
        status: { not: 'CANCELLED' },
        id: { not: id } // Exclude the current turno
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'El horario seleccionado ya está ocupado' }, { status: 409 });
    }

    const updatedTurno = await prisma.turno.update({
      where: { id },
      data: {
        date: dateParsed,
        startTime: startTimeParsed,
        endTime: endTimeParsed
      }
    });

    // Notify Patient via WhatsApp
    try {
      const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || "http://localhost:3000";
      const fechaOriginal = formatInArgentina(turnoActual.date, 'dd/MM/yyyy');
      const horaOriginal = formatInArgentina(turnoActual.startTime, 'HH:mm');
      const fechaNueva = formatInArgentina(updatedTurno.date, 'dd/MM/yyyy');
      const horaNueva = formatInArgentina(updatedTurno.startTime, 'HH:mm');

      if (turnoActual.paciente.phone) {
        await fetch(`${WHATSAPP_BOT_URL}/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: turnoActual.paciente.phone,
            message: `Hola ${turnoActual.paciente.fullName}, tu turno del día ${fechaOriginal} a las ${horaOriginal} ha sido MODIFICADO.\n\n✅ Nueva Fecha: ${fechaNueva}\n✅ Nuevo Horario: ${horaNueva} hs\nProfesional: Lic. ${turnoActual.admin.fullName}`
          })
        });
      }

      // Notify Admin via WhatsApp
      if (turnoActual.admin.phone) {
        await fetch(`${WHATSAPP_BOT_URL}/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: turnoActual.admin.phone,
            message: `🗓️ Modificación de Turno:\nEl paciente ${turnoActual.paciente.fullName} ha reprogramado su turno.\n\n✅ Nueva Fecha: ${fechaNueva}\n✅ Nuevo Horario: ${horaNueva} hs`
          })
        });
      }

      // Create Notification bell inside app
      await prisma.notificacion.create({
        data: {
          adminId: turnoActual.adminId,
          message: `El paciente ${turnoActual.paciente.fullName} reprogramó su turno para el ${fechaNueva} a las ${horaNueva} hs.`,
        }
      });
    } catch (botErr) {
      console.error("Error calling WhatsApp bot on modify", botErr);
    }

    return NextResponse.json(updatedTurno, { status: 200 });
  } catch (error) {
    console.error('Error PUT turno:', error);
    return NextResponse.json({ error: 'Error al modificar turno' }, { status: 500 });
  }
}

