import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/rutinas/[id]/pacientes — Get all patients assigned to copies of this routine
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sourceRutina = await prisma.rutina.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!sourceRutina) {
      return NextResponse.json({ error: 'Rutina no encontrada.' }, { status: 404 });
    }

    // Find all routines with the same name that are assigned to a patient
    const assignedRutinas = await prisma.rutina.findMany({
      where: {
        name: sourceRutina.name,
        pacienteId: { not: null },
      },
      select: {
        id: true,
        pacienteId: true,
        paciente: {
          select: { id: true, fullName: true, dni: true },
        },
      },
    });

    // Extract unique patient IDs
    const assignedPatientIds = assignedRutinas
      .map((r) => r.pacienteId)
      .filter((id): id is string => id !== null);

    return NextResponse.json({ assignedPatientIds }, { status: 200 });
  } catch (error) {
    console.error('Get Assigned Patients Error:', error);
    return NextResponse.json({ error: 'Error al obtener pacientes asignados' }, { status: 500 });
  }
}
