import request from 'supertest';
import express, { Application } from 'express';
import { prisma } from '../setup';
import * as statsController from '../../src/controllers/statsController';
import { generateToken } from '../../src/utils/auth';
import { authenticate } from '../../src/middleware/auth';

// Create test app
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());

  // Protected routes with auth middleware
  app.get('/api/stats', authenticate, statsController.getStats as any);

  // Error handling
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
};

describe('Stats API Integration Tests', () => {
  let app: Application;
  let userToken: string;
  let userId: string;
  let otherUserToken: string;
  let otherUserId: string;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'stats-test1@example.com',
        passwordHash: 'hash',
        name: 'Test Master 1',
        slug: 'stats-test-1'
      }
    });
    userId = user1.id;
    userToken = generateToken({ id: userId, email: user1.email });

    const user2 = await prisma.user.create({
      data: {
        email: 'stats-test2@example.com',
        passwordHash: 'hash',
        name: 'Test Master 2',
        slug: 'stats-test-2'
      }
    });
    otherUserId = user2.id;
    otherUserToken = generateToken({ id: otherUserId, email: user2.email });
  });

  afterEach(async () => {
    await prisma.appointment.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('GET /api/stats - Basic Stats', () => {
    it('should return zero stats for new user', async () => {
      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalAppointments');
      expect(response.body).toHaveProperty('completedAppointments');
      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('totalExpenses');
      expect(response.body).toHaveProperty('netProfit');
      expect(response.body).toHaveProperty('monthlyStats');

      expect(response.body.totalAppointments).toBe(0);
      expect(response.body.totalRevenue).toBe(0);
      expect(response.body.totalExpenses).toBe(0);
      expect(response.body.netProfit).toBe(0);
      expect(Array.isArray(response.body.monthlyStats)).toBe(true);
      expect(response.body.monthlyStats.length).toBe(6);
    });

    it('should calculate revenue from completed appointments', async () => {
      await prisma.appointment.createMany({
        data: [
          {
            userId,
            clientName: 'Client 1',
            clientPhone: '+79991234567',
            startTime: new Date('2024-03-25T10:00:00.000Z'),
            endTime: new Date('2024-03-25T11:00:00.000Z'),
            status: 'COMPLETED',
            finalPrice: 5000
          },
          {
            userId,
            clientName: 'Client 2',
            clientPhone: '+79991234568',
            startTime: new Date('2024-03-26T10:00:00.000Z'),
            endTime: new Date('2024-03-26T11:00:00.000Z'),
            status: 'COMPLETED',
            finalPrice: 3000
          }
        ]
      });

      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.totalRevenue).toBe(8000);
      expect(response.body.completedAppointments).toBe(2);
      expect(response.body.netProfit).toBe(8000);
    });

    it('should calculate expenses', async () => {
      await prisma.expense.createMany({
        data: [
          {
            userId,
            amount: 2000,
            description: 'Materials'
          },
          {
            userId,
            amount: 1500,
            description: 'Rent'
          }
        ]
      });

      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.totalExpenses).toBe(3500);
    });

    it('should calculate net profit correctly', async () => {
      await prisma.appointment.create({
        data: {
          userId,
          clientName: 'Client 1',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-25T10:00:00.000Z'),
          endTime: new Date('2024-03-25T11:00:00.000Z'),
          status: 'COMPLETED',
          finalPrice: 10000
        }
      });

      await prisma.expense.createMany({
        data: [
          { userId, amount: 3000, description: 'Expense 1' },
          { userId, amount: 2000, description: 'Expense 2' }
        ]
      });

      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.totalRevenue).toBe(10000);
      expect(response.body.totalExpenses).toBe(5000);
      expect(response.body.netProfit).toBe(5000);
    });

    it('should not include non-completed appointments in revenue', async () => {
      await prisma.appointment.createMany({
        data: [
          {
            userId,
            clientName: 'Client 1',
            clientPhone: '+79991234567',
            startTime: new Date('2024-03-25T10:00:00.000Z'),
            endTime: new Date('2024-03-25T11:00:00.000Z'),
            status: 'BOOKED',
            finalPrice: 5000
          },
          {
            userId,
            clientName: 'Client 2',
            clientPhone: '+79991234568',
            startTime: new Date('2024-03-26T10:00:00.000Z'),
            endTime: new Date('2024-03-26T11:00:00.000Z'),
            status: 'CANCELED',
            finalPrice: 3000
          },
          {
            userId,
            clientName: 'Client 3',
            clientPhone: '+79991234569',
            startTime: new Date('2024-03-27T10:00:00.000Z'),
            endTime: new Date('2024-03-27T11:00:00.000Z'),
            status: 'COMPLETED',
            finalPrice: 2000
          }
        ]
      });

      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.totalRevenue).toBe(2000);
      expect(response.body.completedAppointments).toBe(1);
    });

    it('should handle appointments without finalPrice', async () => {
      await prisma.appointment.create({
        data: {
          userId,
          clientName: 'Client 1',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-25T10:00:00.000Z'),
          endTime: new Date('2024-03-25T11:00:00.000Z'),
          status: 'COMPLETED'
          // finalPrice is null
        }
      });

      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.totalRevenue).toBe(0);
      expect(response.body.completedAppointments).toBe(1);
    });
  });

  describe('GET /api/stats - User Isolation', () => {
    it('should not include other users data in stats', async () => {
      // User1: appointments and expenses
      await prisma.appointment.create({
        data: {
          userId,
          clientName: 'User1 Client',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-25T10:00:00.000Z'),
          endTime: new Date('2024-03-25T11:00:00.000Z'),
          status: 'COMPLETED',
          finalPrice: 5000
        }
      });

      await prisma.expense.create({
        data: {
          userId,
          amount: 2000,
          description: 'User1 expense'
        }
      });

      // User2: appointments and expenses
      await prisma.appointment.create({
        data: {
          userId: otherUserId,
          clientName: 'User2 Client',
          clientPhone: '+79991234568',
          startTime: new Date('2024-03-25T10:00:00.000Z'),
          endTime: new Date('2024-03-25T11:00:00.000Z'),
          status: 'COMPLETED',
          finalPrice: 10000
        }
      });

      await prisma.expense.create({
        data: {
          userId: otherUserId,
          amount: 5000,
          description: 'User2 expense'
        }
      });

      // User1 stats
      const user1Stats = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(user1Stats.body.totalRevenue).toBe(5000);
      expect(user1Stats.body.totalExpenses).toBe(2000);

      // User2 stats
      const user2Stats = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200);

      expect(user2Stats.body.totalRevenue).toBe(10000);
      expect(user2Stats.body.totalExpenses).toBe(5000);
    });
  });

  describe('GET /api/stats - Monthly Stats', () => {
    it('should return 6 months of stats', async () => {
      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.monthlyStats.length).toBe(6);
    });

    it('should calculate monthly revenue correctly', async () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Create appointment in current month
      await prisma.appointment.create({
        data: {
          userId,
          clientName: 'Current Month Client',
          clientPhone: '+79991234567',
          startTime: new Date(currentYear, currentMonth, 15, 10, 0, 0),
          endTime: new Date(currentYear, currentMonth, 15, 11, 0, 0),
          status: 'COMPLETED',
          finalPrice: 5000
        }
      });

      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Find current month in stats
      const currentMonthStr = format(new Date(), 'yyyy-MM');
      const currentMonthStat = response.body.monthlyStats.find(
        (s: any) => s.month === currentMonthStr
      );

      expect(currentMonthStat).toBeDefined();
      expect(currentMonthStat.revenue).toBe(5000);
      expect(currentMonthStat.appointments).toBe(1);
    });

    it('should distribute appointments across months correctly', async () => {
      const now = new Date();
      const currentYear = now.getFullYear();

      // Create appointments across 3 different months
      await prisma.appointment.createMany({
        data: [
          {
            userId,
            clientName: 'Month 1 Client',
            clientPhone: '+79991234567',
            startTime: new Date(currentYear, now.getMonth() - 2, 15, 10, 0, 0),
            endTime: new Date(currentYear, now.getMonth() - 2, 15, 11, 0, 0),
            status: 'COMPLETED',
            finalPrice: 3000
          },
          {
            userId,
            clientName: 'Month 2 Client',
            clientPhone: '+79991234568',
            startTime: new Date(currentYear, now.getMonth() - 1, 15, 10, 0, 0),
            endTime: new Date(currentYear, now.getMonth() - 1, 15, 11, 0, 0),
            status: 'COMPLETED',
            finalPrice: 4000
          },
          {
            userId,
            clientName: 'Month 3 Client',
            clientPhone: '+79991234569',
            startTime: new Date(currentYear, now.getMonth(), 15, 10, 0, 0),
            endTime: new Date(currentYear, now.getMonth(), 15, 11, 0, 0),
            status: 'COMPLETED',
            finalPrice: 5000
          }
        ]
      });

      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Check that different months have different revenues
      const revenues = response.body.monthlyStats.map((s: any) => s.revenue);
      expect(revenues).toContain(3000);
      expect(revenues).toContain(4000);
      expect(revenues).toContain(5000);
    });

    it('should have months in chronological order', async () => {
      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const months = response.body.monthlyStats.map((s: any) => s.month);
      for (let i = 0; i < months.length - 1; i++) {
        expect(months[i] < months[i + 1]).toBe(true);
      }
    });
  });

  describe('GET /api/stats - Edge Cases', () => {
    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/stats')
        .expect(401);
    });

    it('should handle negative profit (expenses > revenue)', async () => {
      await prisma.appointment.create({
        data: {
          userId,
          clientName: 'Client',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-25T10:00:00.000Z'),
          endTime: new Date('2024-03-25T11:00:00.000Z'),
          status: 'COMPLETED',
          finalPrice: 2000
        }
      });

      await prisma.expense.create({
        data: {
          userId,
          amount: 5000,
          description: 'Large expense'
        }
      });

      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.netProfit).toBe(-3000);
    });

    it('should handle zero finalPrice in appointments', async () => {
      await prisma.appointment.create({
        data: {
          userId,
          clientName: 'Client',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-25T10:00:00.000Z'),
          endTime: new Date('2024-03-25T11:00:00.000Z'),
          status: 'COMPLETED',
          finalPrice: 0
        }
      });

      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.totalRevenue).toBe(0);
    });
  });
});

// Helper function for date formatting
function format(date: Date, formatStr: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  if (formatStr === 'yyyy-MM') {
    return `${year}-${month}`;
  }

  return date.toISOString();
}
