import request from 'supertest';
import express, { Application } from 'express';
import { prisma } from '../setup';
import * as clientsController from '../../src/controllers/clientsController';
import { generateToken } from '../../src/utils/auth';
import { authenticate } from '../../src/middleware/auth';
import { validateClient } from '../../src/middleware/validate';

// Helper to run validation
const handleValidation = (req: any, res: any, next: any) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Create test app
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());

  // Protected routes with auth middleware
  app.get('/api/clients', authenticate, clientsController.getClients as any);
  app.post('/api/clients', validateClient, handleValidation, authenticate, clientsController.createClient as any);

  // Error handling
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  return app;
};

describe('Clients API Integration Tests', () => {
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
        email: 'client-test1@example.com',
        passwordHash: 'hash',
        name: 'Test Master 1',
        slug: 'client-test-1'
      }
    });
    userId = user1.id;
    userToken = generateToken({ id: userId, email: user1.email });

    const user2 = await prisma.user.create({
      data: {
        email: 'client-test2@example.com',
        passwordHash: 'hash',
        name: 'Test Master 2',
        slug: 'client-test-2'
      }
    });
    otherUserId = user2.id;
    otherUserToken = generateToken({ id: otherUserId, email: user2.email });
  });

  afterEach(async () => {
    await prisma.client.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('GET /api/clients', () => {
    it('should return empty array when no clients exist', async () => {
      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return clients for authenticated user', async () => {
      // Create test clients
      await prisma.client.createMany({
        data: [
          {
            userId,
            name: 'Anna Ivanova',
            phone: '+79991234567',
            notes: 'Regular client'
          },
          {
            userId,
            name: 'Maria Petrova',
            phone: '+79991234568',
            notes: 'Prefers evening appointments'
          }
        ]
      });

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].name).toBe('Anna Ivanova');
      expect(response.body[1].name).toBe('Maria Petrova');
    });

    it('should not return clients for other users', async () => {
      // Create clients for user1
      await prisma.client.createMany({
        data: [
          {
            userId,
            name: 'User1 Client',
            phone: '+79991234567',
            notes: 'User1 client'
          }
        ]
      });

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200);

      expect(response.body.length).toBe(0);
    });

    it('should return clients ordered by name ascending', async () => {
      await prisma.client.createMany({
        data: [
          {
            userId,
            name: 'Zinaida',
            phone: '+79991234569',
            notes: 'Z'
          },
          {
            userId,
            name: 'Anna',
            phone: '+79991234567',
            notes: 'A'
          },
          {
            userId,
            name: 'Maria',
            phone: '+79991234568',
            notes: 'M'
          }
        ]
      });

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body[0].name).toBe('Anna');
      expect(response.body[1].name).toBe('Maria');
      expect(response.body[2].name).toBe('Zinaida');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/clients')
        .expect(401);
    });

    it('should include all client fields', async () => {
      await prisma.client.create({
        data: {
          userId,
          name: 'Test Client',
          phone: '+79991234567',
          notes: 'Test notes'
        }
      });

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('phone');
      expect(response.body[0]).toHaveProperty('notes');
      expect(response.body[0]).toHaveProperty('userId');
      expect(response.body[0]).toHaveProperty('createdAt');
      expect(response.body[0]).toHaveProperty('updatedAt');
    });
  });

  describe('POST /api/clients', () => {
    it('should create a new client successfully', async () => {
      const newClient = {
        name: 'Svetlana Volkova',
        phone: '+79991234567',
        notes: 'New client'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newClient)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('client');
      expect(response.body.client.name).toBe(newClient.name);
      expect(response.body.client.phone).toBe(newClient.phone);
      expect(response.body.client.notes).toBe(newClient.notes);
      expect(response.body.client.userId).toBe(userId);
      expect(response.body.client).toHaveProperty('id');
    });

    it('should create client without notes', async () => {
      const newClient = {
        name: 'Ivan Smirnov',
        phone: '+79991234568'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newClient)
        .expect(201);

      expect(response.body.client.name).toBe(newClient.name);
      expect(response.body.client.notes).toBeNull();
    });

    it('should not create client with duplicate phone number for same user', async () => {
      const clientData = {
        name: 'Test Client',
        phone: '+79991234567',
        notes: 'First client'
      };

      // Create first client
      await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send(clientData)
        .expect(201);

      // Try to create second client with same phone
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Another Client',
          phone: '+79991234567',
          notes: 'Second client'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('уже существует');
    });

    it('should allow different users to have clients with same phone number', async () => {
      const phone = '+79991234567';

      // User1 creates client
      await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'User1 Client',
          phone
        })
        .expect(201);

      // User2 creates client with same phone
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          name: 'User2 Client',
          phone
        })
        .expect(201);

      expect(response.body.client.name).toBe('User2 Client');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Client'
          // phone is missing
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for invalid phone format', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Client',
          phone: 'invalid-phone'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for non-Russian phone number', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Client',
          phone: '+1234567890'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: '   ',
          phone: '+79991234567'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/clients')
        .send({
          name: 'Test Client',
          phone: '+79991234567'
        })
        .expect(401);
    });

    it('should trim whitespace from name', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: '  Test Client  ',
          phone: '+79991234567'
        })
        .expect(201);

      expect(response.body.client.name).toBe('Test Client');
    });

    it('should handle very long notes', async () => {
      const longNotes = 'A'.repeat(1000);

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Client',
          phone: '+79991234567',
          notes: longNotes
        })
        .expect(201);

      expect(response.body.client.notes).toBe(longNotes);
    });
  });
});
