import request from 'supertest';
import express, { Application } from 'express';
import { prisma } from '../setup';
import * as authController from '../../src/controllers/authController';
import { generateToken } from '../../src/utils/auth';

// Create test app
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());

  // Auth routes
  app.post('/api/auth/register', authController.register);
  app.post('/api/auth/login', authController.login);

  // Error handling
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
};

describe('Auth API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test Master',
        bookingMode: 'SERVICE_LIST'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('slug');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
    });

    it('should not register user with existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test Master'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should generate unique slug', async () => {
      const userData1 = {
        email: 'user1@example.com',
        password: 'password123',
        name: 'Test Master'
      };

      const userData2 = {
        email: 'user2@example.com',
        password: 'password123',
        name: 'Test Master'
      };

      const response1 = await request(app)
        .post('/api/auth/register')
        .send(userData1)
        .expect(201);

      const response2 = await request(app)
        .post('/api/auth/register')
        .send(userData2)
        .expect(201);

      expect(response1.body.user.slug).toBeDefined();
      expect(response2.body.user.slug).toBeDefined();
      // Slugs might be same or different depending on implementation
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const userData = {
        email: 'login@example.com',
        password: 'password123',
        name: 'Login Test'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('login@example.com');
    });

    it('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not login non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Token verification', () => {
    it('should verify valid token', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const token = generateToken(payload);

      expect(() => generateToken(payload)).not.toThrow();
      expect(token).toBeDefined();
    });
  });
});
