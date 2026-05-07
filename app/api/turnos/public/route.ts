import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseArgentinaDate, formatInArgentina } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

// POST /api/turnos/public — Public booking (patient identifies with DNI, name, phone)
export async function POST(req: Request) {
  try {
    const { adminId, dni, fullName, phone, date, startTime, endTime } = await req.json();

    if (!adminId || !dni || !fullName || !phone || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const dateParsed = parseArgentinaDate(date);
    const startTimeParsed = parseArgentinaDate(startTime);
    const endTimeParsed = parseArgentinaDate(endTime);

    // Find existing patient by DNI
    let paciente = await prisma.paciente.findUnique({ where: { dni } });

    if (!paciente) {
      // Create a new patient record with minimal data
      paciente = await prisma.paciente.create({
        data: {
          fullName,
          dni,
          phone,
          adminId,
        }
      });
    } else {
      // Update phone if different
      if (paciente.phone !== phone) {
        await prisma.paciente.update({
          where: { id: paciente.id },
          data: { phone }
        });
      }
    }

    // Check if slot is already taken
    const existingTurno = await prisma.turno.findFirst({
      where: {
        adminId,
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
        pacienteId: paciente.id,
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

      console.log(`[WhatsApp Public] Intentando notificar a la URL: ${WHATSAPP_BOT_URL}/send-message`);

      if (newTurno.paciente.phone) {
        const patientRes = await fetch(`${WHATSAPP_BOT_URL}/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: newTurno.paciente.phone,
            message: `¡Hola ${newTurno.paciente.fullName}!\nTu turno fue confirmado para el ${fechaTurno} a las ${horaTurno} hs con el Lic. ${newTurno.admin.fullName}.\nPodés ver/modificar tu turno acá: https://omegafit.agustindev.com.ar/turnos/buscar`
          })
        });
        console.log(`[WhatsApp Public] Respuesta paciente: ${patientRes.status} ${patientRes.statusText}`);
      }

      const adminData = await prisma.admin.findUnique({ where: { id: adminId } });
      if (adminData && adminData.phone) {
        const adminRes = await fetch(`${WHATSAPP_BOT_URL}/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: adminData.phone,
            message: `¡Nuevo Turno!\n${newTurno.paciente.fullName} ha agendado un turno el ${fechaTurno} a las ${horaTurno}.`
          })
        });
        console.log(`[WhatsApp Public] Respuesta admin: ${adminRes.status} ${adminRes.statusText}`);
      }
    } catch (botErr) {
      console.error("[WhatsApp Public] Error crítico llamando al bot:", botErr);
    }

    return NextResponse.json(newTurno, { status: 201 });
  } catch (error) {
    console.error('Error POST public turno:', error);
    return NextResponse.json({ error: 'Error al crear turno' }, { status: 500 });
  }
}

