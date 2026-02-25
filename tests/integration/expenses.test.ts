import request from 'supertest';
import express, { Application } from 'express';
import { prisma } from '../setup';
import * as expensesController from '../../src/controllers/expensesController';
import * as statsController from '../../src/controllers/statsController';
import { generateToken } from '../../src/utils/auth';
import { authenticate } from '../../src/middleware/auth';

// Create test app
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());

  // Protected routes with auth middleware
  app.post('/api/expenses', authenticate, expensesController.createExpense as any);
  app.get('/api/stats', authenticate, statsController.getStats as any);

  // Error handling
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
};

describe('Expenses API Integration Tests', () => {
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
        email: 'expense-test1@example.com',
        passwordHash: 'hash',
        name: 'Test Master 1',
        slug: 'expense-test-1'
      }
    });
    userId = user1.id;
    userToken = generateToken({ id: userId, email: user1.email });

    const user2 = await prisma.user.create({
      data: {
        email: 'expense-test2@example.com',
        passwordHash: 'hash',
        name: 'Test Master 2',
        slug: 'expense-test-2'
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

  describe('POST /api/expenses', () => {
    it('should create expense successfully', async () => {
      const expenseData = {
        amount: 5000,
        description: 'Materials for manicure'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('expense');
      expect(response.body.expense.amount).toBe(expenseData.amount);
      expect(response.body.expense.description).toBe(expenseData.description);
      expect(response.body.expense.userId).toBe(userId);
      expect(response.body.expense).toHaveProperty('id');
      expect(response.body.expense).toHaveProperty('createdAt');
    });

    it('should create expense with minimal amount', async () => {
      const expenseData = {
        amount: 1,
        description: 'Small expense'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.expense.amount).toBe(1);
    });

    it('should create expense with large amount', async () => {
      const expenseData = {
        amount: 1000000,
        description: 'Equipment purchase'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.expense.amount).toBe(1000000);
    });

    it('should return 400 for amount = 0', async () => {
      const expenseData = {
        amount: 0,
        description: 'Test expense'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expenseData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for negative amount', async () => {
      const expenseData = {
        amount: -100,
        description: 'Test expense'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expenseData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for non-integer amount', async () => {
      const expenseData = {
        amount: 5000.5,
        description: 'Test expense'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expenseData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for missing amount', async () => {
      const expenseData = {
        description: 'Test expense'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expenseData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for empty description', async () => {
      const expenseData = {
        amount: 5000,
        description: '   '
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expenseData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for missing description', async () => {
      const expenseData = {
        amount: 5000
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expenseData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 401 without authentication', async () => {
      const expenseData = {
        amount: 5000,
        description: 'Test expense'
      };

      await request(app)
        .post('/api/expenses')
        .send(expenseData)
        .expect(401);
    });

    it('should trim description whitespace', async () => {
      const expenseData = {
        amount: 5000,
        description: '  Materials  '
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.expense.description).toBe('Materials');
    });

    it('should create multiple expenses for same user', async () => {
      const expense1 = {
        amount: 5000,
        description: 'Materials'
      };

      const expense2 = {
        amount: 3000,
        description: 'Rent'
      };

      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expense1)
        .expect(201);

      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expense2)
        .expect(201);

      const expenses = await prisma.expense.findMany({
        where: { userId }
      });

      expect(expenses.length).toBe(2);
    });
  });

  describe('Expenses and Stats Integration', () => {
    it('should calculate correct profit including expenses', async () => {
      // Create appointments with revenue
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

      // Create expenses
      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 2000,
          description: 'Materials'
        });

      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 1000,
          description: 'Rent'
        });

      // Get stats
      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.revenue).toBe(8000); // 5000 + 3000
      expect(response.body.expenses).toBe(3000); // 2000 + 1000
      expect(response.body.profit).toBe(5000); // 8000 - 3000
    });

    it('should not include other user expenses in stats', async () => {
      // User1: Create appointment and expense
      await prisma.appointment.create({
        data: {
          userId,
          clientName: 'Client 1',
          clientPhone: '+79991234567',
          startTime: new Date('2024-03-25T10:00:00.000Z'),
          endTime: new Date('2024-03-25T11:00:00.000Z'),
          status: 'COMPLETED',
          finalPrice: 5000
        }
      });

      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 2000,
          description: 'User1 expense'
        });

      // User2: Create expense
      await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          amount: 5000,
          description: 'User2 expense'
        });

      // User1 stats should not include User2's expenses
      const response = await request(app)
        .get('/api/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.expenses).toBe(2000);
      expect(response.body.profit).toBe(3000); // 5000 - 2000
    });
  });

  describe('Expense Edge Cases', () => {
    it('should handle special characters in description', async () => {
      const expenseData = {
        amount: 5000,
        description: 'Наборы для маникюча / гель-лак @2024!'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.expense.description).toBe(expenseData.description);
    });

    it('should handle very long description', async () => {
      const longDescription = 'A'.repeat(500);

      const expenseData = {
        amount: 5000,
        description: longDescription
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.expense.description).toBe(longDescription);
    });

    it('should handle unicode characters in description', async () => {
      const expenseData = {
        amount: 5000,
        description: '購入材料 💅✨'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.expense.description).toBe(expenseData.description);
    });

    it('should create expense with timestamp', async () => {
      const beforeCreate = new Date();

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 5000,
          description: 'Test expense'
        })
        .expect(201);

      const afterCreate = new Date();
      const createdAt = new Date(response.body.expense.createdAt);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });
});
