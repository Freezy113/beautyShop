import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import {
  validateRegistration,
  validateLogin,
  validateService,
  validateAppointment,
  validateClient,
  validateExpense,
  validateId
} from '../../../src/middleware/validate';

// Helper to run validation chains in tests
const runValidation = async (req: Request, validations: any[]) => {
  for (const validation of validations) {
    await validation.run(req);
  }
  return validationResult(req);
};

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {}
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('validateRegistration', () => {
    it('should pass with valid registration data', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test Master'
      };

      const result = await runValidation(
        mockReq as Request,
        validateRegistration
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should normalize email', async () => {
      mockReq.body = {
        email: '  Test@Example.COM  ',
        password: 'password123',
        name: 'Test Master'
      };

      await runValidation(
        mockReq as Request,
        mockRes as Response,
        mockNext,
        validateRegistration
      );

      expect(mockReq.body.email).toBe('test@example.com');
    });

    it('should fail with invalid email format', async () => {
      mockReq.body = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test Master'
      };

      const result = await runValidation(
        mockReq as Request,
        validateRegistration
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'field',
            path: 'email'
          })
        ])
      );
    });

    it('should fail with missing email', async () => {
      mockReq.body = {
        password: 'password123',
        name: 'Test Master'
      };

      const result = await runValidation(
        mockReq as Request,
        validateRegistration
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with password less than 6 characters', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: '12345',
        name: 'Test Master'
      };

      const result = await runValidation(
        mockReq as Request,
        validateRegistration
      );

      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].path).toBe('password');
    });

    it('should fail with missing password', async () => {
      mockReq.body = {
        email: 'test@example.com',
        name: 'Test Master'
      };

      const result = await runValidation(
        mockReq as Request,
        validateRegistration
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with empty name', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        name: '   '
      };

      const result = await runValidation(
        mockReq as Request,
        validateRegistration
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with missing name', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await runValidation(
        mockReq as Request,
        validateRegistration
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should trim name whitespace', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        name: '  Test Master  '
      };

      await runValidation(
        mockReq as Request,
        mockRes as Response,
        mockNext,
        validateRegistration
      );

      expect(mockReq.body.name).toBe('Test Master');
    });
  });

  describe('validateLogin', () => {
    it('should pass with valid login data', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await runValidation(
        mockReq as Request,
        validateLogin
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid email', async () => {
      mockReq.body = {
        email: 'not-an-email',
        password: 'password123'
      };

      const result = await runValidation(
        mockReq as Request,
        validateLogin
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with missing password', async () => {
      mockReq.body = {
        email: 'test@example.com'
      };

      const result = await runValidation(
        mockReq as Request,
        validateLogin
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with missing email', async () => {
      mockReq.body = {
        password: 'password123'
      };

      const result = await runValidation(
        mockReq as Request,
        validateLogin
      );

      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('validateService', () => {
    it('should pass with valid service data', async () => {
      mockReq.body = {
        name: 'Manicure',
        price: 1500,
        durationMin: 60,
        isPublic: true
      };

      const result = await runValidation(
        mockReq as Request,
        validateService
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should pass without isPublic field (optional)', async () => {
      mockReq.body = {
        name: 'Manicure',
        price: 1500,
        durationMin: 60
      };

      const result = await runValidation(
        mockReq as Request,
        validateService
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with empty name', async () => {
      mockReq.body = {
        name: '   ',
        price: 1500,
        durationMin: 60
      };

      const result = await runValidation(
        mockReq as Request,
        validateService
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with negative price', async () => {
      mockReq.body = {
        name: 'Manicure',
        price: -100,
        durationMin: 60
      };

      const result = await runValidation(
        mockReq as Request,
        validateService
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with duration less than 15 minutes', async () => {
      mockReq.body = {
        name: 'Manicure',
        price: 1500,
        durationMin: 10
      };

      const result = await runValidation(
        mockReq as Request,
        validateService
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with non-integer price', async () => {
      mockReq.body = {
        name: 'Manicure',
        price: 1500.5,
        durationMin: 60
      };

      const result = await runValidation(
        mockReq as Request,
        validateService
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with non-boolean isPublic', async () => {
      mockReq.body = {
        name: 'Manicure',
        price: 1500,
        durationMin: 60,
        isPublic: 'true'
      };

      const result = await runValidation(
        mockReq as Request,
        validateService
      );

      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('validateAppointment', () => {
    const validAppointment = {
      clientName: 'Maria Petrova',
      clientPhone: '+79991234567',
      startTime: '2024-03-25T10:00:00.000Z',
      endTime: '2024-03-25T11:00:00.000Z'
    };

    it('should pass with valid appointment data', async () => {
      mockReq.body = { ...validAppointment };

      const result = await runValidation(
        mockReq as Request,
        validateAppointment
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should pass with all optional fields', async () => {
      mockReq.body = {
        ...validAppointment,
        serviceId: '550e8400-e29b-41d4-a716-446655440000',
        finalPrice: 1500,
        notes: 'Test notes'
      };

      const result = await runValidation(
        mockReq as Request,
        validateAppointment
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid serviceId (not UUID)', async () => {
      mockReq.body = {
        ...validAppointment,
        serviceId: 'not-a-uuid'
      };

      const result = await runValidation(
        mockReq as Request,
        validateAppointment
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with non-Russian phone number', async () => {
      mockReq.body = {
        ...validAppointment,
        clientPhone: '+1234567890'
      };

      const result = await runValidation(
        mockReq as Request,
        validateAppointment
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with invalid phone format', async () => {
      mockReq.body = {
        ...validAppointment,
        clientPhone: 'abc123'
      };

      const result = await runValidation(
        mockReq as Request,
        validateAppointment
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with invalid ISO8601 date', async () => {
      mockReq.body = {
        ...validAppointment,
        startTime: 'not-a-date'
      };

      const result = await runValidation(
        mockReq as Request,
        validateAppointment
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with negative finalPrice', async () => {
      mockReq.body = {
        ...validAppointment,
        finalPrice: -100
      };

      const result = await runValidation(
        mockReq as Request,
        validateAppointment
      );

      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('validateClient', () => {
    it('should pass with valid client data', async () => {
      mockReq.body = {
        name: 'Maria Petrova',
        phone: '+79991234567'
      };

      const result = await runValidation(
        mockReq as Request,
        validateClient
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should pass with optional notes', async () => {
      mockReq.body = {
        name: 'Maria Petrova',
        phone: '+79991234567',
        notes: 'Regular client'
      };

      const result = await runValidation(
        mockReq as Request,
        validateClient
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with empty name', async () => {
      mockReq.body = {
        name: '   ',
        phone: '+79991234567'
      };

      const result = await runValidation(
        mockReq as Request,
        validateClient
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with non-Russian phone', async () => {
      mockReq.body = {
        name: 'Maria Petrova',
        phone: '+1234567890'
      };

      const result = await runValidation(
        mockReq as Request,
        validateClient
      );

      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('validateExpense', () => {
    it('should pass with valid expense data', async () => {
      mockReq.body = {
        amount: 5000,
        description: 'Materials'
      };

      const result = await runValidation(
        mockReq as Request,
        validateExpense
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with amount = 0', async () => {
      mockReq.body = {
        amount: 0,
        description: 'Materials'
      };

      const result = await runValidation(
        mockReq as Request,
        validateExpense
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with negative amount', async () => {
      mockReq.body = {
        amount: -100,
        description: 'Materials'
      };

      const result = await runValidation(
        mockReq as Request,
        validateExpense
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with empty description', async () => {
      mockReq.body = {
        amount: 5000,
        description: '   '
      };

      const result = await runValidation(
        mockReq as Request,
        validateExpense
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with non-integer amount', async () => {
      mockReq.body = {
        amount: 5000.5,
        description: 'Materials'
      };

      const result = await runValidation(
        mockReq as Request,
        validateExpense
      );

      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('validateId', () => {
    it('should pass with valid UUID', async () => {
      mockReq.params = {
        id: '550e8400-e29b-41d4-a716-446655440000'
      };

      const result = await runValidation(
        mockReq as Request,
        validateId
      );

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid UUID format', async () => {
      mockReq.params = {
        id: 'not-a-uuid'
      };

      const result = await runValidation(
        mockReq as Request,
        validateId
      );

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with empty string', async () => {
      mockReq.params = {
        id: ''
      };

      const result = await runValidation(
        mockReq as Request,
        validateId
      );

      expect(result.isEmpty()).toBe(false);
    });
  });
});
