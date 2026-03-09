// Script para actualizar o crear el admin con las credenciales correctas
// Ejecutar con: npx tsx scripts/seed-admin.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Buscar si ya existe un admin con ese DNI
  const existing = await prisma.admin.findUnique({
    where: { dni: '11223344' }
  });

  if (existing) {
    // Actualizar el admin existente
    const updated = await prisma.admin.update({
      where: { dni: '11223344' },
      data: {
        fullName: 'Oscar Robles',
        username: 'oscar',
        password: 'charizard23', // Texto plano, sin hash
        email: existing.email, // Mantener el email actual
      }
    });
    console.log('✅ Admin actualizado:', {
      id: updated.id,
      fullName: updated.fullName,
      username: updated.username,
      dni: updated.dni,
      password: updated.password,
      email: updated.email,
    });
  } else {
    // Crear nuevo admin
    const created = await prisma.admin.create({
      data: {
        fullName: 'Oscar Robles',
        email: 'oscar@kineapp.com',
        dni: '11223344',
        password: 'charizard23', // Texto plano, sin hash
        username: 'oscar',
      }
    });
    console.log('✅ Admin creado:', {
      id: created.id,
      fullName: created.fullName,
      username: created.username,
      dni: created.dni,
      password: created.password,
      email: created.email,
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
