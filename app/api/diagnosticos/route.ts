import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Para simplificar, obtenemos los diagnósticos únicos a partir de los arrays de los pacientes
    // PostgreSQL permite operaciones complejas, pero a nivel aplicación podemos extraerlos
    // Aquí simulamo un "Select Distinct" desempaquetando el array de diagnósticos
    
    const pacientes = await prisma.paciente.findMany({
      select: { diagnoses: true }
    });
    
    const allDiagnoses = new Set<string>();
    pacientes.forEach((p: { diagnoses: string[] }) => {
      p.diagnoses.forEach((d: string) => allDiagnoses.add(d));
    });

    return NextResponse.json(Array.from(allDiagnoses), { status: 200 });
  } catch (error) {
    console.error('Fetch Diagnosticos Error:', error);
    return NextResponse.json({ error: 'Error al obtener diagnósticos' }, { status: 500 });
  }
}
