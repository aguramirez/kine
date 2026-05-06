import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admins = await prisma.admin.findMany({
      select: { id: true, fullName: true, slotDuration: true },
      orderBy: { fullName: 'asc' }
    });
    return NextResponse.json(admins, { status: 200 });
  } catch (error) {
    console.error('Error GET admins:', error);
    return NextResponse.json({ error: 'Error al obtener admins' }, { status: 500 });
  }
}
