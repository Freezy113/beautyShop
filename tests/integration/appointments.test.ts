import request from 'supertest';
import express, { Application } from 'express';
import { prisma } from '../setup';
import * as appointmentsController from '../../src/controllers/appointmentsController';
import { generateToken } from '../../src/utils/auth';
import { authenticate } from '../../src/middleware/auth';

// Create test app
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());

  // Protected routes with auth middleware
  app.get('/api/appointments', authenticate, appointmentsController.getAppointments as any);
  app.put('/api/appointments/:id', authenticate, appointmentsController.updateAppointment as any);

  // Error handling
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
};

describe('Appointments API Integration Tests', () => {
  let app: Application;
  let userToken: string;
  let userId: string;
  let otherUserToken: string;
  let otherUserId: string;
  let testAppointmentId: string;
  let testServiceId: string;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'appointment-test1@example.com',
        passwordHash: 'hash',
        name: 'Test Master 1',
        slug: 'appointment-test-1'
      }
    });
    userId = user1.id;
    userToken = generateToken({ id: userId, email: user1.email });

    const user2 = await prisma.user.create({
      data: {
        email: 'appointment-test2@example.com',
        passwordHash: 'hash',
        name: 'Test Master 2',
        slug: 'appointment-test-2'
      }
    });
    otherUserId = user2.id;
    otherUserToken = generateToken({ id: otherUserId, email: user2.email });

    // Create test service
    const service = await prisma.service.create({
      data: {
        userId,
        name: 'Test Service',
        price: 1500,
        durationMin: 60,
        isPublic: true
      }
    });
    testServiceId = service.id;

    // Create test appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId,
        serviceId: testServiceId,
        clientName: 'Test Client',
        clientPhone: '+79991234567',
        startTime: new Date('2024-03-25T10:00:00.000Z'),
        endTime: new Date('2024-03-25T11:00:00.000Z'),
        status: 'BOOKED',
        finalPrice: 1500
      }
    });
    testAppointmentId = appointment.id;
  });

  afterEach(async () => {
    // Clean up
    await prisma.appointment.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('GET /api/appointments', () => {
    it('should return appointments for authenticated user', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(testAppointmentId);
      expect(response.body[0].clientName).toBe('Test Client');
      expect(response.body[0].service).toBeDefined();
      expect(response.body[0].service.name).toBe('Test Service');
    });

    it('should not return appointments for other users', async () => {
      // Create appointment for user1
      await prisma.appointment.create({
        data: {
          userId,
          serviceId: testServiceId,
          clientName: 'User1 Client',
          clientPhone: '+79991234568',
          startTime: new Date('2024-03-26T10:00:00.000Z'),
          endTime: new Date('2024-03-26T11:00:00.000Z'),
          status: 'BOOKED'
        }
      });

      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200);

      expect(response.body.length).toBe(0);
    });

    it('should filter by status', async () => {
      // Create appointments with different statuses
      await prisma.appointment.createMany({
        data: [
          {
            userId,
            serviceId: testServiceId,
            clientName: 'Client 2',
            clientPhone: '+79991234569',
            startTime: new Date('2024-03-26T10:00:00.000Z'),
            endTime: new Date('2024-03-26T11:00:00.000Z'),
            status: 'COMPLETED'
          },
          {
            userId,
            serviceId: testServiceId,
            clientName: 'Client 3',
            clientPhone: '+79991234570',
            startTime: new Date('2024-03-27T10:00:00.000Z'),
            endTime: new Date('2024-03-27T11:00:00.000Z'),
            status: 'CANCELED'
          }
        ]
      });

      const response = await request(app)
        .get('/api/appointments?status=COMPLETED')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('COMPLETED');
    });

    it('should filter by date range', async () => {
      // Create appointments in different months
      await prisma.appointment.createMany({
        data: [
          {
            userId,
            serviceId: testServiceId,
            clientName: 'March Client',
            clientPhone: '+79991234569',
            startTime: new Date('2024-03-15T10:00:00.000Z'),
            endTime: new Date('2024-03-15T11:00:00.000Z'),
            status: 'BOOKED'
          },
          {
            userId,
            serviceId: testServiceId,
            clientName: 'April Client',
            clientPhone: '+79991234570',
            startTime: new Date('2024-04-15T10:00:00.000Z'),
            endTime: new Date('2024-04-15T11:00:00.000Z'),
            status: 'BOOKED'
          }
        ]
      });

      const response = await request(app)
        .get('/api/appointments?startDate=2024-03-01&endDate=2024-03-31')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach((apt: any) => {
        const aptDate = new Date(apt.startTime);
        expect(aptDate.getMonth()).toBe(2); // March (0-indexed)
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/appointments')
        .expect(401);
    });

    it('should order by startTime descending', async () => {
      await prisma.appointment.createMany({
        data: [
          {
            userId,
            serviceId: testServiceId,
            clientName: 'Early Appointment',
            clientPhone: '+79991234569',
            startTime: new Date('2024-03-20T10:00:00.000Z'),
            endTime: new Date('2024-03-20T11:00:00.000Z'),
            status: 'BOOKED'
          },
          {
            userId,
            serviceId: testServiceId,
            clientName: 'Late Appointment',
            clientPhone: '+79991234570',
            startTime: new Date('2024-03-30T10:00:00.000Z'),
            endTime: new Date('2024-03-30T11:00:00.000Z'),
            status: 'BOOKED'
          }
        ]
      });

      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const times = response.body.map((apt: any) => new Date(apt.startTime).getTime());
      for (let i = 0; i < times.length - 1; i++) {
        expect(times[i]).toBeGreaterThanOrEqual(times[i + 1]);
      }
    });
  });

  describe('PUT /api/appointments/:id', () => {
    it('should update appointment status', async () => {
      const response = await request(app)
        .put(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'COMPLETED'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.appointment.status).toBe('COMPLETED');
      expect(response.body.appointment.clientName).toBe('Test Client');
    });

    it('should update appointment finalPrice', async () => {
      const response = await request(app)
        .put(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          finalPrice: 2000
        })
        .expect(200);

      expect(response.body.appointment.finalPrice).toBe(2000);
    });

    it('should update appointment notes', async () => {
      const response = await request(app)
        .put(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          notes: 'Client prefers lighter shade'
        })
        .expect(200);

      expect(response.body.appointment.notes).toBe('Client prefers lighter shade');
    });

    it('should update appointment time when slot is available', async () => {
      const response = await request(app)
        .put(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          startTime: '2024-03-26T14:00:00.000Z',
          endTime: '2024-03-26T15:00:00.000Z'
        })
        .expect(200);

      expect(new Date(response.body.appointment.startTime).toISOString()).toBe('2024-03-26T14:00:00.000Z');
    });

    it('should not update time when slot is occupied', async () => {
      // Create conflicting appointment
      await prisma.appointment.create({
        data: {
          userId,
          serviceId: testServiceId,
          clientName: 'Conflicting Client',
          clientPhone: '+79991234569',
          startTime: new Date('2024-03-26T10:00:00.000Z'),
          endTime: new Date('2024-03-26T11:00:00.000Z'),
          status: 'BOOKED'
        }
      });

      const response = await request(app)
        .put(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          startTime: '2024-03-26T10:30:00.000Z',
          endTime: '2024-03-26T11:30:00.000Z'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('занят');
    });

    it('should return 404 for non-existent appointment', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app)
        .put(`/api/appointments/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'COMPLETED'
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should not allow user to update other user appointment', async () => {
      const response = await request(app)
        .put(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          status: 'CANCELED'
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should update client information', async () => {
      const response = await request(app)
        .put(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          clientName: 'Updated Name',
          clientPhone: '+79999999999'
        })
        .expect(200);

      expect(response.body.appointment.clientName).toBe('Updated Name');
      expect(response.body.appointment.clientPhone).toBe('+79999999999');
    });

    it('should update service association', async () => {
      // Create another service
      const newService = await prisma.service.create({
        data: {
          userId,
          name: 'New Service',
          price: 2000,
          durationMin: 90,
          isPublic: true
        }
      });

      const response = await request(app)
        .put(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          serviceId: newService.id
        })
        .expect(200);

      expect(response.body.appointment.service.id).toBe(newService.id);
      expect(response.body.appointment.service.name).toBe('New Service');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .put(`/api/appointments/${testAppointmentId}`)
        .send({
          status: 'COMPLETED'
        })
        .expect(401);
    });

    it('should handle partial updates', async () => {
      const originalData = await prisma.appointment.findUnique({
        where: { id: testAppointmentId }
      });

      const response = await request(app)
        .put(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          notes: 'New note'
        })
        .expect(200);

      // Other fields should remain unchanged
      expect(response.body.appointment.clientName).toBe(originalData!.clientName);
      expect(response.body.appointment.status).toBe(originalData!.status);
      expect(response.body.appointment.notes).toBe('New note');
    });
  });
});
