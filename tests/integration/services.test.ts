import request from 'supertest';
import express, { Application } from 'express';
import { prisma } from '../setup';
import * as authController from '../../src/controllers/authController';
import * as servicesController from '../../src/controllers/servicesController';
import { verifyToken } from '../../src/utils/auth';

// Auth middleware
const authMiddleware = (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = verifyToken(token);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Create test app
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());

  // Auth routes
  app.post('/api/auth/register', authController.register);
  app.post('/api/auth/login', authController.login);

  // Services routes (protected)
  app.get('/api/services', authMiddleware, servicesController.getServices as any);
  app.post('/api/services', authMiddleware, servicesController.createService as any);

  // Error handling
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
};

describe('Services API Integration Tests', () => {
  let app: Application;
  let authToken: string;
  let userId: string;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    // Register and login test user
    const userData = {
      email: `service${Date.now()}@example.com`,
      password: 'password123',
      name: 'Service Test'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  describe('POST /api/services', () => {
    it('should create a new service', async () => {
      const serviceData = {
        name: 'Маникюр',
        price: 1500,
        durationMin: 60,
        isPublic: true
      };

      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send(serviceData)
        .expect(201);

      expect(response.body).toHaveProperty('service');
      expect(response.body.service.name).toBe(serviceData.name);
      expect(response.body.service.price).toBe(serviceData.price);
      expect(response.body.service.durationMin).toBe(serviceData.durationMin);
    });

    it('should not create service without auth', async () => {
      const serviceData = {
        name: 'Маникюр',
        price: 1500,
        durationMin: 60
      };

      await request(app)
        .post('/api/services')
        .send(serviceData)
        .expect(401);
    });
  });

  describe('GET /api/services', () => {
    beforeEach(async () => {
      // Create test services
      await prisma.service.create({
        data: {
          userId,
          name: 'Маникюр',
          price: 1500,
          durationMin: 60,
          isPublic: true
        }
      });

      await prisma.service.create({
        data: {
          userId,
          name: 'Педикюр',
          price: 2000,
          durationMin: 90,
          isPublic: true
        }
      });
    });

    it('should get all services for authenticated user', async () => {
      const response = await request(app)
        .get('/api/services')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body.services)).toBe(true);
      expect(response.body.services.length).toBeGreaterThan(0);
      expect(response.body.services[0]).toHaveProperty('name');
      expect(response.body.services[0]).toHaveProperty('price');
    });

    it('should not get services without auth', async () => {
      await request(app)
        .get('/api/services')
        .expect(401);
    });
  });
});
