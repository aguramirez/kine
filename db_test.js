// db_test.js (Script para comprobar que Prisma puede escribir a Neon)
const { PrismaClient } = require('@prisma/client');

async function testDB() {
  console.log("Inicializando Prisma Client...");
  const prisma = new PrismaClient();

  try {
    console.log("Intentando crear Paciente test...");
    const p = await prisma.paciente.create({
      data: {
        fullName: "Prueba Sistema",
        dni: "12345678",
        phone: "11223344",
        email: "prueba@test.com",
        gender: "M",
        age: 30,
        height: 1.80,
        weight: 80,
        healthInsurance: "OSDE",
        totalInvoiced: 1500,
        totalPaid: 1000,
        difference: 500, // Lógica del negocio
        diagnoses: ["Prueba Diagnóstico"],
        spadi: { espm: 5, csasel: 2 } // Mock object json
      }
    });

    console.log("Paciente creado exitosamente:", p);

    console.log("Eliminando registro de prueba...");
    await prisma.paciente.delete({ where: { id: p.id } });
    console.log("Prueba superada.");

  } catch (err) {
    console.error("Test Falló:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
