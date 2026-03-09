import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const ejercicios = await prisma.ejercicio.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(ejercicios, { status: 200 });
  } catch (error) {
    console.error('Fetch Ejercicios Error:', error);
    return NextResponse.json({ error: 'Error al obtener ejercicios' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.name || !data.description) {
      return NextResponse.json({ error: 'Nombre y descripción son obligatorios.' }, { status: 400 });
    }

    const newEjercicio = await prisma.ejercicio.create({
      data: {
        name: data.name,
        description: data.description,
        videoUrl: data.videoUrl || null // Acá se guardará la URL de Cloudinary a futuro
      }
    });

    return NextResponse.json(newEjercicio, { status: 201 });
  } catch (error) {
    console.error('Create Ejercicio Error:', error);
    return NextResponse.json({ error: 'Error al crear el ejercicio' }, { status: 500 });
  }
}
