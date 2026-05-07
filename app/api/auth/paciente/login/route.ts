import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signJwt } from '@/lib/auth';
import { getNowInArgentina } from '@/lib/date-utils';

export async function POST(req: Request) {
  try {
    const { dni } = await req.json();

    if (!dni) {
      return NextResponse.json({ error: 'El DNI es requerido' }, { status: 400 });
    }

    const paciente = await prisma.paciente.findUnique({
      where: { dni }
    });

    if (!paciente) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Regla de Negocio: Acceso Post-Alta
    // Si is Active es falso, evaluamos la dischargeDate (Fecha límite)
    if (!paciente.isActive) {
      if (paciente.dischargeDate) {
        const now = getNowInArgentina();
        const dischargeLimit = new Date(paciente.dischargeDate);
        
        if (now > dischargeLimit) {
          return NextResponse.json({ error: 'Acceso denegado: El periodo post-alta ha finalizado.' }, { status: 403 });
        }
      } else {
        // Si no está activo y no hay fecha límite, cerramos acceso por defecto.
        return NextResponse.json({ error: 'Acceso denegado: Paciente dado de alta sin periodo de gracia.' }, { status: 403 });
      }
    }

    const token = signJwt({ id: paciente.id, role: 'PACIENTE', dni: paciente.dni });

    return NextResponse.json({ 
      message: 'Login exitoso', 
      token, 
      paciente: { id: paciente.id, fullName: paciente.fullName } 
    }, { status: 200 });

  } catch (error) {
    console.error('Login Paciente Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

