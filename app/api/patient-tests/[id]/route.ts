import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const test = await prisma.patientTest.findUnique({
      where: { id },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json(test, { status: 200 });
  } catch (error) {
    console.error('Fetch PatientTest Error:', error);
    return NextResponse.json({ error: 'Error al obtener el test' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.patientTest.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const updated = await prisma.patientTest.update({
      where: { id },
      data: {
        testType: data.testType || existing.testType,
        responses: data.responses || existing.responses,
        totalScore: data.totalScore !== undefined ? data.totalScore : existing.totalScore,
        subScores: data.subScores || existing.subScores,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Update PatientTest Error:', error);
    return NextResponse.json({ error: 'Error al actualizar el test' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.patientTest.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Test deleted' }, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }
    console.error('Delete PatientTest Error:', error);
    return NextResponse.json({ error: 'Error al eliminar el test' }, { status: 500 });
  }
}
