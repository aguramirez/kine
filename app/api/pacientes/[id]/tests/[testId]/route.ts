import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; testId: string }> }) {
  try {
    const { id, testId } = await params;

    const test = await prisma.patientTest.findFirst({
      where: { id: testId, pacienteId: id },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test no encontrado' }, { status: 404 });
    }

    await prisma.patientTest.delete({
      where: { id: testId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete Test Error:', error);
    return NextResponse.json({ error: 'Error al eliminar el test' }, { status: 500 });
  }
}
