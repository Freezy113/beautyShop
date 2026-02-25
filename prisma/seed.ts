import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create a test master
  const master = await prisma.user.create({
    data: {
      email: 'master@example.com',
      passwordHash: hashedPassword,
      name: 'Мастер Красоты',
      slug: 'krasota-master'
    }
  });

  // Create some test services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        userId: master.id,
        name: 'Маникюр',
        price: 2000,
        durationMin: 60,
        isPublic: true
      }
    }),
    prisma.service.create({
      data: {
        userId: master.id,
        name: 'Педикюр',
        price: 2500,
        durationMin: 90,
        isPublic: true
      }
    }),
    prisma.service.create({
      data: {
        userId: master.id,
        name: 'Укладка волос',
        price: 3000,
        durationMin: 120,
        isPublic: true
      }
    })
  ]);

  // Create a test client
  await prisma.client.create({
    data: {
      userId: master.id,
      name: 'Анна Иванова',
      phone: '+79991234567',
      notes: 'Постоянный клиент'
    }
  });

  // Create a test appointment
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const endTime = new Date(tomorrow);
  endTime.setHours(11, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      userId: master.id,
      serviceId: services[0].id,
      clientName: 'Мария Петрова',
      clientPhone: '+79997654321',
      startTime: tomorrow,
      endTime: endTime,
      finalPrice: 2000,
      notes: 'Маникюр + покрытие гель-лак'
    }
  });

  console.log('Database seeded successfully!');
  console.log(`Created master with slug: ${master.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });