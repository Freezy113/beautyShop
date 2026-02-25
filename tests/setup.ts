import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup test database
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up test data before each test
  await prisma.appointment.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.user.deleteMany({});
});

export { prisma };
