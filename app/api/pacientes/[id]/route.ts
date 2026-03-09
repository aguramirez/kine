import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const paciente = await prisma.paciente.findUnique({
      where: { id },
      include: {
        rutinas: {
          include: { dias: { include: { ejercicios: true } } }
        }
      }
    });

    if (!paciente) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    return NextResponse.json(paciente, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener el paciente' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    // Regla de Negocio: Cálculo Financiero al actualizar
    if (data.totalInvoiced !== undefined || data.totalPaid !== undefined) {
      // Necesitamos los valores actuales si solo se actualiza uno de los dos
      const dbPaciente = await prisma.paciente.findUnique({ where: { id } });
      if (!dbPaciente) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });

      const finalInvoiced = data.totalInvoiced !== undefined ? data.totalInvoiced : dbPaciente.totalInvoiced;
      const finalPaid = data.totalPaid !== undefined ? data.totalPaid : dbPaciente.totalPaid;
      
      data.difference = finalInvoiced - finalPaid;
    }

    const updatedPaciente = await prisma.paciente.update({
      where: { id },
      data
    });

    return NextResponse.json(updatedPaciente, { status: 200 });
  } catch (error) {
    console.error("Update Paciente Error:", error);
    return NextResponse.json({ error: 'Error al actualizar el paciente' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.paciente.delete({
      where: { id }
    });
    return NextResponse.json({ message: 'Paciente eliminado correctamente' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar el paciente' }, { status: 500 });
  }
}
