import request from 'supertest';
import express, { Application } from 'express';
import { prisma } from '../setup';
import * as publicController from '../../src/controllers/publicController';
import { validationResult } from 'express-validator';

// Mock validation middleware to skip validation in tests
const mockValidate = (req: any, res: any, next: any) => {
  // Simulate successful validation
  next();
};

// Create test app
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());

  // Public routes (no authentication required)
  app.get('/api/public/:slug', publicController.getMasterData);
  app.post('/api/public/:slug/book', mockValidate, publicController.bookAppointment);

  // Error handling
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
};

describe('Public Booking API Integration Tests', () => {
  let app: Application;
  let userId: string;
  let userSlug: string;
  let serviceId: string;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    // Create test user with SERVICE_LIST mode
    const user = await prisma.user.create({
      data: {
        email: 'public-test@example.com',
        passwordHash: 'hash',
        name: 'Test Master',
        slug: 'test-master-public',
        bookingMode: 'SERVICE_LIST'
      }
    });
    userId = user.id;
    userSlug = user.slug;

    // Create test services
    const service = await prisma.service.create({
      data: {
        userId,
        name: 'Manicure',
        price: 1500,
        durationMin: 60,
        isPublic: true
      }
    });
    serviceId = service.id;

    // Create a private service (should not be returned)
    await prisma.service.create({
      data: {
        userId,
        name: 'VIP Service',
        price: 5000,
        durationMin: 120,
        isPublic: false
      }
    });
  });

  afterEach(async () => {
    await prisma.appointment.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('GET /api/public/:slug', () => {
    it('should return master data with public services', async () => {
      const response = await request(app)
        .get(`/api/public/${userSlug}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('bookingMode');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('appointments');

      expect(response.body.name).toBe('Test Master');
      expect(response.body.bookingMode).toBe('SERVICE_LIST');
      expect(Array.isArray(response.body.services)).toBe(true);
      expect(response.body.services.length).toBe(1);
      expect(response.body.services[0].name).toBe('Manicure');
      expect(response.body.services[0].isPublic).toBeUndefined(); // Not returned in select
    });

    it('should not return private services', async () => {
      const response = await request(app)
        .get(`/api/public/${userSlug}`)
        .expect(200);

      expect(response.body.services.length).toBe(1);
      expect(response.body.services[0].name).toBe('Manicure');
    });

    it('should return future booked appointments', async () => {
      // Create a booked appointment
      await prisma.appointment.create({
        data: {
          userId,
          clientName: 'Future Client',
          clientPhone: '+79991234567',
          startTime: new Date(Date.now() + 86400000), // Tomorrow
          endTime: new Date(Date.now() + 86400000 + 3600000),
          status: 'BOOKED'
        }
      });

      const response = await request(app)
        .get(`/api/public/${userSlug}`)
        .expect(200);

      expect(response.body.appointments.length).toBe(1);
      expect(response.body.appointments[0].status).toBeUndefined(); // Not in select
      expect(response.body.appointments[0].clientName).toBe('Future Client');
    });

    it('should not return past appointments', async () => {
      // Create a past appointment
      await prisma.appointment.create({
        data: {
          userId,
          clientName: 'Past Client',
          clientPhone: '+79991234567',
          startTime: new Date(Date.now() - 86400000), // Yesterday
          endTime: new Date(Date.now() - 86400000 + 3600000),
          status: 'BOOKED'
        }
      });

      const response = await request(app)
        .get(`/api/public/${userSlug}`)
        .expect(200);

      expect(response.body.appointments.length).toBe(0);
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/public/non-existent-slug')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('не найден');
    });

    it('should return services ordered by createdAt ascending', async () => {
      // Create more services
      await prisma.service.createMany({
        data: [
          {
            userId,
            name: 'Pedicure',
            price: 2000,
            durationMin: 90,
            isPublic: true
          },
          {
            userId,
            name: 'Hair Styling',
            price: 2500,
            durationMin: 60,
            isPublic: true
          }
        ]
      });

      const response = await request(app)
        .get(`/api/public/${userSlug}`)
        .expect(200);

      expect(response.body.services.length).toBe(3);
      expect(response.body.services[0].name).toBe('Manicure');
      expect(response.body.services[1].name).toBe('Pedicure');
      expect(response.body.services[2].name).toBe('Hair Styling');
    });

    it('should return appointments ordered by startTime ascending', async () => {
      const now = Date.now();
      const day = 86400000;

      await prisma.appointment.createMany({
        data: [
          {
            userId,
            clientName: 'Client 3',
            clientPhone: '+79991234569',
            startTime: new Date(now + day * 3),
            endTime: new Date(now + day * 3 + 3600000),
            status: 'BOOKED'
          },
          {
            userId,
            clientName: 'Client 1',
            clientPhone: '+79991234567',
            startTime: new Date(now + day),
            endTime: new Date(now + day + 3600000),
            status: 'BOOKED'
          },
          {
            userId,
            clientName: 'Client 2',
            clientPhone: '+79991234568',
            startTime: new Date(now + day * 2),
            endTime: new Date(now + day * 2 + 3600000),
            status: 'BOOKED'
          }
        ]
      });

      const response = await request(app)
        .get(`/api/public/${userSlug}`)
        .expect(200);

      expect(response.body.appointments[0].clientName).toBe('Client 1');
      expect(response.body.appointments[1].clientName).toBe('Client 2');
      expect(response.body.appointments[2].clientName).toBe('Client 3');
    });

    it('should return empty appointments array when no future appointments', async () => {
      const response = await request(app)
        .get(`/api/public/${userSlug}`)
        .expect(200);

      expect(Array.isArray(response.body.appointments)).toBe(true);
      expect(response.body.appointments.length).toBe(0);
    });
  });

  describe('POST /api/public/:slug/book (SERVICE_LIST mode)', () => {
    it('should create appointment with service', async () => {
      const bookingData = {
        serviceId,
        clientName: 'Anna Ivanova',
        clientPhone: '+79991234567',
        startTime: '2024-03-26T10:00:00.000Z',
        endTime: '2024-03-26T11:00:00.000Z',
        finalPrice: 1500
      };

      const response = await request(app)
        .post(`/api/public/${userSlug}/book`)
        .send(bookingData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('appointment');
      expect(response.body.appointment.clientName).toBe(bookingData.clientName);
      expect(response.body.appointment.clientPhone).toBe(bookingData.clientPhone);
      expect(response.body.appointment.serviceId).toBe(serviceId);
      expect(response.body.appointment.finalPrice).toBe(1500);
    });

    it('should create appointment without finalPrice', async () => {
      const bookingData = {
        serviceId,
        clientName: 'Maria Petrova',
        clientPhone: '+79991234568',
        startTime: '2024-03-26T10:00:00.000Z',
        endTime: '2024-03-26T11:00:00.000Z'
      };

      const response = await request(app)
        .post(`/api/public/${userSlug}/book`)
        .send(bookingData)
        .expect(201);

      expect(response.body.appointment.finalPrice).toBeNull();
    });
  });

  describe('POST /api/public/:slug/book (TIME_SLOT mode)', () => {
    beforeEach(async () => {
      // Change user to TIME_SLOT mode
      await prisma.user.update({
        where: { id: userId },
        data: { bookingMode: 'TIME_SLOT' }
      });
    });

    it('should create appointment without service', async () => {
      const bookingData = {
        clientName: 'Svetlana Volkova',
        clientPhone: '+79991234569',
        startTime: '2024-03-26T14:00:00.000Z',
        endTime: '2024-03-26T15:00:00.000Z'
      };

      const response = await request(app)
        .post(`/api/public/${userSlug}/book`)
        .send(bookingData)
        .expect(201);

      expect(response.body.appointment.serviceId).toBeNull();
      expect(response.body.appointment.finalPrice).toBeNull();
    });
  });

  describe('POST /api/public/:slug/book - Time Slot Validation', () => {
    it('should not create appointment with conflicting time', async () => {
      // Create existing appointment
      await prisma.appointment.create({
        data: {
          userId,
          serviceId,
          clientName: 'Existing Client',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-26T10:00:00.000Z'),
          endTime: new Date('2024-03-26T11:00:00.000Z'),
          status: 'BOOKED'
        }
      });

      const bookingData = {
        serviceId,
        clientName: 'New Client',
        clientPhone: '+79991234568',
        startTime: '2024-03-26T10:30:00.000Z',
        endTime: '2024-03-26T11:30:00.000Z'
      };

      const response = await request(app)
        .post(`/api/public/${userSlug}/book`)
        .send(bookingData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('занят');
    });

    it('should create appointment when slot is available', async () => {
      // Create existing appointment at 10:00-11:00
      await prisma.appointment.create({
        data: {
          userId,
          serviceId,
          clientName: 'Existing Client',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-26T10:00:00.000Z'),
          endTime: new Date('2024-03-26T11:00:00.000Z'),
          status: 'BOOKED'
        }
      });

      // Book at 14:00-15:00 (no conflict)
      const bookingData = {
        serviceId,
        clientName: 'New Client',
        clientPhone: '+79991234568',
        startTime: '2024-03-26T14:00:00.000Z',
        endTime: '2024-03-26T15:00:00.000Z'
      };

      const response = await request(app)
        .post(`/api/public/${userSlug}/book`)
        .send(bookingData)
        .expect(201);

      expect(response.body.appointment.clientName).toBe('New Client');
    });

    it('should create appointment right after existing one', async () => {
      await prisma.appointment.create({
        data: {
          userId,
          serviceId,
          clientName: 'Existing Client',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-26T10:00:00.000Z'),
          endTime: new Date('2024-03-26T11:00:00.000Z'),
          status: 'BOOKED'
        }
      });

      const bookingData = {
        serviceId,
        clientName: 'New Client',
        clientPhone: '+79991234568',
        startTime: '2024-03-26T11:00:00.000Z',
        endTime: '2024-03-26T12:00:00.000Z'
      };

      const response = await request(app)
        .post(`/api/public/${userSlug}/book`)
        .send(bookingData)
        .expect(201);

      expect(response.body.appointment.clientName).toBe('New Client');
    });

    it('should create appointment right before existing one', async () => {
      await prisma.appointment.create({
        data: {
          userId,
          serviceId,
          clientName: 'Existing Client',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-26T11:00:00.000Z'),
          endTime: new Date('2024-03-26T12:00:00.000Z'),
          status: 'BOOKED'
        }
      });

      const bookingData = {
        serviceId,
        clientName: 'New Client',
        clientPhone: '+79991234568',
        startTime: '2024-03-26T10:00:00.000Z',
        endTime: '2024-03-26T11:00:00.000Z'
      };

      const response = await request(app)
        .post(`/api/public/${userSlug}/book`)
        .send(bookingData)
        .expect(201);

      expect(response.body.appointment.clientName).toBe('New Client');
    });
  });

  describe('POST /api/public/:slug/book - Edge Cases', () => {
    it('should return 404 for non-existent slug', async () => {
      const bookingData = {
        clientName: 'Test Client',
        clientPhone: '+79991234567',
        startTime: '2024-03-26T10:00:00.000Z',
        endTime: '2024-03-26T11:00:00.000Z'
      };

      const response = await request(app)
        .post('/api/public/non-existent-slug/book')
        .send(bookingData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should create appointment with notes', async () => {
      const bookingData = {
        serviceId,
        clientName: 'Client with Notes',
        clientPhone: '+79991234567',
        startTime: '2024-03-26T10:00:00.000Z',
        endTime: '2024-03-26T11:00:00.000Z',
        notes: 'Allergic to certain products'
      };

      const response = await request(app)
        .post(`/api/public/${userSlug}/book`)
        .send(bookingData)
        .expect(201);

      expect(response.body.appointment.notes).toBe('Allergic to certain products');
    });

    it('should handle Russian characters in client name', async () => {
      const bookingData = {
        serviceId,
        clientName: 'Мария Иванова',
        clientPhone: '+79991234567',
        startTime: '2024-03-26T10:00:00.000Z',
        endTime: '2024-03-26T11:00:00.000Z'
      };

      const response = await request(app)
        .post(`/api/public/${userSlug}/book`)
        .send(bookingData)
        .expect(201);

      expect(response.body.appointment.clientName).toBe('Мария Иванова');
    });
  });
});
