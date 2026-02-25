import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../../src/middleware/auth';
import { generateToken } from '../../../src/utils/auth';
import { AuthRequest } from '../../../src/types';

// Mock Express Request, Response, and NextFunction
const createMockRequest = (authHeader?: string): Partial<AuthRequest> => ({
  headers: {
    authorization: authHeader
  }
});

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return res;
};

const mockNext: NextFunction = jest.fn();

describe('authenticate middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockRes = createMockResponse();
    next = mockNext;
    jest.clearAllMocks();
  });

  describe('Successful authentication', () => {
    it('should call next() with valid token', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      mockReq = createMockRequest(`Bearer ${token}`);

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user).toEqual(expect.objectContaining({
        id: payload.id,
        email: payload.email
      }));
    });

    it('should attach decoded user to request object', () => {
      const payload = { id: 'user-123', email: 'user@test.com' };
      const token = generateToken(payload);
      mockReq = createMockRequest(`Bearer ${token}`);

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(payload.id);
      expect(mockReq.user.email).toBe(payload.email);
    });
  });

  describe('Missing or invalid Authorization header', () => {
    it('should return 401 when Authorization header is missing', () => {
      mockReq = createMockRequest(undefined);

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is empty', () => {
      mockReq = createMockRequest('');

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header does not start with Bearer', () => {
      const token = generateToken({ id: '123', email: 'test@example.com' });
      mockReq = createMockRequest(`InvalidScheme ${token}`);

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when only Bearer prefix is provided', () => {
      mockReq = createMockRequest('Bearer ');

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Invalid tokens', () => {
    it('should return 401 for malformed token', () => {
      mockReq = createMockRequest('Bearer invalid.token.here');

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for random string', () => {
      mockReq = createMockRequest('Bearer not-a-jwt-token');

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for token signed with different secret', () => {
      // This would be a token signed with a different JWT_SECRET
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.fake-signature';
      mockReq = createMockRequest(`Bearer ${fakeToken}`);

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Token extraction', () => {
    it('should correctly extract token after Bearer prefix', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      const authHeader = `Bearer ${token}`;

      mockReq = createMockRequest(authHeader);

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(next).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
    });

    it('should handle token with extra spaces gracefully', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      // Extra spaces - this might still fail with current implementation
      mockReq = createMockRequest(`Bearer  ${token}`);

      authenticate(mockReq as Request, mockRes as Response, next);

      // Current implementation extracts from index 7, so extra space would be included
      // This test documents current behavior
      expect(next).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Request object mutation', () => {
    it('should not modify request headers', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      const originalHeaders = { authorization: `Bearer ${token}` };
      mockReq = createMockRequest(originalHeaders.authorization);

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(mockReq.headers).toEqual(originalHeaders);
    });

    it('should add user property to request', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const token = generateToken(payload);
      mockReq = createMockRequest(`Bearer ${token}`);

      authenticate(mockReq as Request, mockRes as Response, next);

      expect('user' in mockReq).toBe(true);
      expect(typeof mockReq.user).toBe('object');
    });
  });

  describe('Response format', () => {
    it('should return JSON error response', () => {
      mockReq = createMockRequest(undefined);

      authenticate(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('should return consistent error message format', () => {
      // Test missing token
      mockReq = createMockRequest(undefined);
      authenticate(mockReq as Request, mockRes as Response, next);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });

      // Reset mocks
      jest.clearAllMocks();
      mockRes = createMockResponse();

      // Test invalid token
      mockReq = createMockRequest('Bearer invalid');
      authenticate(mockReq as Request, mockRes as Response, next);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });
  });
});
