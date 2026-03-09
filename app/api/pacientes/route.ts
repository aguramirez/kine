import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const pacientes = await prisma.paciente.findMany({
      include: {
        rutinas: {
          include: {
            dias: {
              include: { ejercicios: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(pacientes, { status: 200 });
  } catch (error) {
    console.error('Fetch Pacientes Error:', error);
    return NextResponse.json({ error: 'Error al obtener pacientes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Solo fullName y DNI son obligatorios
    if (!data.fullName?.trim() || !data.dni?.trim()) {
      return NextResponse.json({ error: 'Nombre completo y DNI son obligatorios.' }, { status: 400 });
    }

    // Regla de Negocio: Cálculo Financiero
    const totalInvoiced = data.totalInvoiced || 0;
    const totalPaid = data.totalPaid || 0;
    const difference = totalInvoiced - totalPaid;

    const newPaciente = await prisma.paciente.create({
      data: {
        fullName: data.fullName.trim(),
        dni: data.dni.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        gender: data.gender || null,
        age: data.age ? Number(data.age) : null,
        height: data.height ? Number(data.height) : null,
        weight: data.weight ? Number(data.weight) : null,
        notes: data.notes?.trim() || null,
        healthInsurance: data.healthInsurance?.trim() || null,
        diagnoses: data.diagnoses || [],
        spadi: data.spadi || {},
        // @ts-ignore: Prisma schema update might not be fully synced in IDE yet
        spadiEnd: data.spadiEnd || {},
        totalSessions: data.totalSessions ? Number(data.totalSessions) : 0,
        totalInvoiced,
        totalPaid,
        difference,
      }
    });

    return NextResponse.json(newPaciente, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El DNI ya se encuentra registrado.' }, { status: 409 });
    }
    console.error('Create Paciente Error:', error);
    return NextResponse.json({ error: 'Error al crear el paciente' }, { status: 500 });
  }
}
