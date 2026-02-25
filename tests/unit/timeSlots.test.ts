import { isTimeSlotAvailable } from '../../src/utils/auth';
import { prisma } from '../setup';

describe('isTimeSlotAvailable', () => {
  let userId: string;
  let existingAppointmentId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'timeslot-test@example.com',
        passwordHash: 'hash',
        name: 'Test Master',
        slug: 'timeslot-test-master'
      }
    });
    userId = user.id;
  });

  beforeEach(async () => {
    // Clean up appointments before each test
    await prisma.appointment.deleteMany({ where: { userId } });
  });

  describe('No existing appointments', () => {
    it('should return true when no appointments exist', async () => {
      const startTime = new Date('2024-03-25T10:00:00.000Z');
      const endTime = new Date('2024-03-25T11:00:00.000Z');

      const isAvailable = await isTimeSlotAvailable(userId, startTime, endTime);

      expect(isAvailable).toBe(true);
    });
  });

  describe('Full overlap', () => {
    beforeEach(async () => {
      // Create existing appointment: 10:00-11:00
      const appointment = await prisma.appointment.create({
        data: {
          userId,
          clientName: 'Existing Client',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-25T10:00:00.000Z'),
          endTime: new Date('2024-03-25T11:00:00.000Z'),
          status: 'BOOKED'
        }
      });
      existingAppointmentId = appointment.id;
    });

    it('should return false for exact same time slot', async () => {
      const startTime = new Date('2024-03-25T10:00:00.000Z');
      const endTime = new Date('2024-03-25T11:00:00.000Z');

      const isAvailable = await isTimeSlotAvailable(userId, startTime, endTime);

      expect(isAvailable).toBe(false);
    });

    it('should return false for fully encompassing slot', async () => {
      const startTime = new Date('2024-03-25T09:00:00.000Z');
      const endTime = new Date('2024-03-25T12:00:00.000Z');

      const isAvailable = await isTimeSlotAvailable(userId, startTime, endTime);

      expect(isAvailable).toBe(false);
    });
  });

  describe('Partial overlap - start inside', () => {
    beforeEach(async () => {
      // Create existing appointment: 10:00-11:00
      await prisma.appointment.create({
        data: {
          userId,
          clientName: 'Existing Client',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-25T10:00:00.000Z'),
          endTime: new Date('2024-03-25T11:00:00.000Z'),
          status: 'BOOKED'
        }
      });
    });

    it('should return false when new slot starts during existing', async () => {
      const startTime = new Date('2024-03-25T10:30:00.000Z');
      const endTime = new Date('2024-03-25T11:30:00.000Z');

      const isAvailable = await isTimeSlotAvailable(userId, startTime, endTime);

      expect(isAvailable).toBe(false);
    });
  });

  describe('Partial overlap - end inside', () => {
    beforeEach(async () => {
      // Create existing appointment: 10:00-11:00
      await prisma.appointment.create({
        data: {
          userId,
          clientName: 'Existing Client',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-25T10:00:00.000Z'),
          endTime: new Date('2024-03-25T11:00:00.000Z'),
          status: 'BOOKED'
        }
      });
    });

    it('should return false when new slot ends during existing', async () => {
      const startTime = new Date('2024-03-25T09:30:00.000Z');
      const endTime = new Date('2024-03-25T10:30:00.000Z');

      const isAvailable = await isTimeSlotAvailable(userId, startTime, endTime);

      expect(isAvailable).toBe(false);
    });
  });

  describe('Nested overlap', () => {
    beforeEach(async () => {
      // Create existing appointment: 10:00-11:00
      await prisma.appointment.create({
        data: {
          userId,
          clientName: 'Existing Client',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-25T10:00:00.000Z'),
          endTime: new Date('2024-03-25T11:00:00.000Z'),
          status: 'BOOKED'
        }
      });
    });

    it('should return false for nested slot', async () => {
      const startTime = new Date('2024-03-25T10:15:00.000Z');
      const endTime = new Date('2024-03-25T10:45:00.000Z');

      const isAvailable = await isTimeSlotAvailable(userId, startTime, endTime);

      expect(isAvailable).toBe(false);
    });
  });

  describe('Boundary cases', () => {
    beforeEach(async () => {
      // Create existing appointment: 10:00-11:00
      await prisma.appointment.create({
        data: {
          userId,
          clientName: 'Existing Client',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-25T10:00:00.000Z'),
          endTime: new Date('2024-03-25T11:00:00.000Z'),
          status: 'BOOKED'
        }
      });
    });

    it('should return true when new slot ends exactly when existing starts', async () => {
      const startTime = new Date('2024-03-25T09:00:00.000Z');
      const endTime = new Date('2024-03-25T10:00:00.000Z');

      const isAvailable = await isTimeSlotAvailable(userId, startTime, endTime);

      expect(isAvailable).toBe(true);
    });

    it('should return true when new slot starts exactly when existing ends', async () => {
      const startTime = new Date('2024-03-25T11:00:00.000Z');
      const endTime = new Date('2024-03-25T12:00:00.000Z');

      const isAvailable = await isTimeSlotAvailable(userId, startTime, endTime);

      expect(isAvailable).toBe(true);
    });
  });

  describe('excludeAppointmentId parameter', () => {
    beforeEach(async () => {
      // Create existing appointment: 10:00-11:00
      const appointment = await prisma.appointment.create({
        data: {
          userId,
          clientName: 'Existing Client',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-25T10:00:00.000Z'),
          endTime: new Date('2024-03-25T11:00:00.000Z'),
          status: 'BOOKED'
        }
      });
      existingAppointmentId = appointment.id;
    });

    it('should return true when excluding the conflicting appointment', async () => {
      const startTime = new Date('2024-03-25T10:00:00.000Z');
      const endTime = new Date('2024-03-25T11:00:00.000Z');

      const isAvailable = await isTimeSlotAvailable(
        userId,
        startTime,
        endTime,
        existingAppointmentId
      );

      expect(isAvailable).toBe(true);
    });

    it('should return false when excluding different appointment', async () => {
      const startTime = new Date('2024-03-25T10:00:00.000Z');
      const endTime = new Date('2024-03-25T11:00:00.000Z');

      const isAvailable = await isTimeSlotAvailable(
        userId,
        startTime,
        endTime,
        'different-appointment-id'
      );

      expect(isAvailable).toBe(false);
    });
  });

  describe('Multiple existing appointments', () => {
    beforeEach(async () => {
      // Create two appointments
      await prisma.appointment.createMany({
        data: [
          {
            userId,
            clientName: 'Client 1',
            clientPhone: '+79991234567',
            startTime: new Date('2024-03-25T09:00:00.000Z'),
            endTime: new Date('2024-03-25T10:00:00.000Z'),
            status: 'BOOKED'
          },
          {
            userId,
            clientName: 'Client 2',
            clientPhone: '+79991234568',
            startTime: new Date('2024-03-25T11:00:00.000Z'),
            endTime: new Date('2024-03-25T12:00:00.000Z'),
            status: 'BOOKED'
          }
        ]
      });
    });

    it('should return true for slot between appointments', async () => {
      const startTime = new Date('2024-03-25T10:00:00.000Z');
      const endTime = new Date('2024-03-25T11:00:00.000Z');

      const isAvailable = await isTimeSlotAvailable(userId, startTime, endTime);

      expect(isAvailable).toBe(true);
    });

    it('should return false when overlapping with any appointment', async () => {
      const startTime = new Date('2024-03-25T09:30:00.000Z');
      const endTime = new Date('2024-03-25T10:30:00.000Z');

      const isAvailable = await isTimeSlotAvailable(userId, startTime, endTime);

      expect(isAvailable).toBe(false);
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.appointment.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });
});
