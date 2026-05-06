import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/turnos/public — Public booking (patient identifies with DNI, name, phone)
export async function POST(req: Request) {
  try {
    const { adminId, dni, fullName, phone, date, startTime, endTime } = await req.json();

    if (!adminId || !dni || !fullName || !phone || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

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
        startTime: new Date(startTime),
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
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
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
        message: `${newTurno.paciente.fullName} ha agendado un turno el ${new Date(date).toLocaleDateString('es-AR')} a las ${new Date(startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
      }
    });

    // Trigger WhatsApp bot API call
    try {
      const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || "http://localhost:3001";
      const fechaTurno = new Date(date).toLocaleDateString('es-AR');
      const horaTurno = new Date(startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      if (newTurno.paciente.phone) {
        await fetch(`${WHATSAPP_BOT_URL}/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: newTurno.paciente.phone,
            message: `¡Hola ${newTurno.paciente.fullName}!\nTu turno fue confirmado para el ${fechaTurno} a las ${horaTurno} hs con el Lic. ${newTurno.admin.fullName}.`
          })
        });
      }

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
    console.error('Error POST public turno:', error);
    return NextResponse.json({ error: 'Error al crear turno' }, { status: 500 });
  }
}
