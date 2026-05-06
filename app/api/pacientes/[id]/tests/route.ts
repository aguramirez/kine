import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TEST_DEFINITIONS, TestType, calculateScores } from '@/lib/test-definitions';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get('type') as TestType | null;

    const where: any = { pacienteId: id };
    if (typeFilter && TEST_DEFINITIONS[typeFilter]) {
      where.testType = typeFilter;
    }

    const tests = await prisma.patientTest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tests, { status: 200 });
  } catch (error) {
    console.error('Fetch Tests Error:', error);
    return NextResponse.json({ error: 'Error al obtener los tests' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { testType, responses } = body;

    if (!testType || !responses) {
      return NextResponse.json({ error: 'testType y responses son obligatorios' }, { status: 400 });
    }

    const scores = calculateScores(testType as TestType, responses);

    const newTest = await prisma.patientTest.create({
      data: {
        pacienteId: id,
        testType: testType as any,
        responses,
        totalScore: scores.total,
        subScores: scores as any,
      },
    });

    return NextResponse.json(newTest, { status: 201 });
  } catch (error) {
    console.error('Create Test Error:', error);
    return NextResponse.json({ error: 'Error al guardar el test' }, { status: 500 });
  }
}
