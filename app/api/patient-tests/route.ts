import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pacienteId = searchParams.get('pacienteId');
    const type = searchParams.get('type'); // SPADI, FABQ, TAMPA, PCS

    if (!pacienteId) {
      return NextResponse.json({ error: 'pacienteId is required' }, { status: 400 });
    }

    const where: any = { pacienteId };
    if (type) {
      where.type = type;
    }

    const tests = await prisma.patientTest.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(tests, { status: 200 });
  } catch (error) {
    console.error('Fetch PatientTests Error:', error);
    return NextResponse.json({ error: 'Error al obtener tests' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.pacienteId || !data.type || !data.data) {
      return NextResponse.json({ error: 'pacienteId, type, and data are required' }, { status: 400 });
    }

    const validTypes = ['SPADI', 'FABQ', 'TAMPA', 'PCS'];
    if (!validTypes.includes(data.type)) {
      return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });
    }

    const newTest = await prisma.patientTest.create({
      data: {
        pacienteId: data.pacienteId,
        type: data.type,
        date: data.date ? new Date(data.date) : new Date(),
        data: data.data,
        results: data.results || {},
      },
    });

    return NextResponse.json(newTest, { status: 201 });
  } catch (error) {
    console.error('Create PatientTest Error:', error);
    return NextResponse.json({ error: 'Error al crear el test' }, { status: 500 });
  }
}
