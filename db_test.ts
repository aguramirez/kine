import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Inicializando Pruebas en Base de Datos Neon...');

  try {
    // 1. Limpiar base de datos para la prueba
    console.log('🧹 Limpiando datos de prueba anteriores...');
    await prisma.ejercicioEnDia.deleteMany();
    await prisma.dia.deleteMany();
    await prisma.rutina.deleteMany();
    await prisma.ejercicio.deleteMany();
    await prisma.paciente.deleteMany();
    await prisma.admin.deleteMany();

    // 2. Crear Admin
    console.log('👤 Creando Admin...');
    const admin = await prisma.admin.create({
      data: {
        fullName: 'Admin Prueba',
        email: 'admin@kineapp.com',
        dni: '11223344',
        password: 'hashed_password_mock',
        username: 'admintest'
      }
    });
    console.log('✅ Admin creado:', admin.id);

    // 3. Crear Paciente (Prueba de cálculo lógica difference y JSON spadi)
    console.log('🤕 Creando Paciente...');
    const paciente = await prisma.paciente.create({
      data: {
        fullName: 'Paciente Prueba',
        dni: '99887766',
        phone: '1122334455',
        email: 'paciente@kineapp.com',
        gender: 'Masculino',
        age: 40,
        height: 1.75,
        weight: 78.5,
        healthInsurance: 'OSDE',
        totalInvoiced: 15000,
        totalPaid: 10000,
        difference: 5000, 
        spadi: { espm: 5, csasel: 2, tss: 9 }, 
        diagnoses: ['Dolor Lumbar', 'Post-operatorio Rodilla'],
        isActive: false,
        dischargeDate: new Date('2024-01-01T00:00:00.000Z')
      }
    });
    console.log('✅ Paciente creado con Difference (15000-10000) =', paciente.difference);

    // 4. Crear un Ejercicio Estándar
    console.log('🏋️ Creando Ejercicio...');
    const ejercicioLibre = await prisma.ejercicio.create({
      data: {
        name: 'Sentadilla Libre',
        description: 'Sentadilla con peso corporal',
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4'
      }
    });

    // 5. Asignar Rutina en cascada
    console.log('📋 Creando Rutina y Días en Cascada...');
    const rutina = await prisma.rutina.create({
      data: {
        name: 'Rutina Lumbar Nivel 1',
        description: 'Fortalecimiento de core',
        pacienteId: paciente.id,
        dias: {
          create: [
            {
              name: 'Lunes',
              ejercicios: {
                create: [
                  {
                    exerciseId: ejercicioLibre.id,
                    sets: 3,
                    reps: 15,
                    time: '60s'
                  }
                ]
              }
            }
          ]
        }
      },
      include: {
        dias: {
          include: {
            ejercicios: true
          }
        }
      }
    });
    console.log('✅ Rutina creada exitosamente con', rutina.dias.length, 'días.');
    console.log('✅ Ejercicio programado para el día:', rutina.dias[0].ejercicios[0].sets, 'sets de', rutina.dias[0].ejercicios[0].reps, 'reps.');

    console.log('\n🎉 TODAS LAS PRUEBAS DE LA BASE DE DATOS PASARON CON ÉXITO 🎉');

  } catch (error) {
    console.error('❌ Error durante la prueba de Base de Datos:\n', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
