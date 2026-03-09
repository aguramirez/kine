import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signJwt } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, email, dni, password } = await req.json();

    if (!password || (!username && !email && !dni)) {
      return NextResponse.json({ error: 'Usuario/Email/DNI y contraseña requeridos' }, { status: 400 });
    }

    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { username: username || '' },
          { email: email || '' },
          { dni: dni || '' }
        ]
      }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Comparación directa de contraseña en texto plano (sin hash)
    if (password !== admin.password) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = signJwt({ id: admin.id, role: 'ADMIN', dni: admin.dni });

    return NextResponse.json({ 
      message: 'Login exitoso', 
      token, 
      admin: { id: admin.id, fullName: admin.fullName } 
    }, { status: 200 });
  } catch (error) {
    console.error('Login Admin Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
