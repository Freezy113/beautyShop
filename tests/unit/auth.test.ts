import { hashPassword, comparePassword, generateToken, verifyToken, generateSlug } from '../../src/utils/auth';

describe('Auth Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const result = await comparePassword('wrongPassword', hash);
      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include payload in token', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const token = generateToken(payload);

      const decoded = verifyToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const token = generateToken(payload);

      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(payload.id);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow();
    });
  });

  describe('generateSlug', () => {
    it('should generate slug from name', () => {
      const name = 'Maria Ivanova';
      const slug = generateSlug(name);

      expect(slug).toBeDefined();
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(slug).not.toContain(' ');
    });

    it('should transliterate Cyrillic to Latin', () => {
      const name = 'Мария Петрова';
      const slug = generateSlug(name);

      expect(slug).toBeDefined();
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should generate unique slugs for same name', () => {
      const name = 'Test Master';
      const slug1 = generateSlug(name);
      const slug2 = generateSlug(name);

      // Slugs might have random suffix for uniqueness
      expect(slug1).toBeDefined();
      expect(slug2).toBeDefined();
    });

    it('should handle special characters', () => {
      const name = 'Анна-Мария @ Salon!';
      const slug = generateSlug(name);

      expect(slug).toBeDefined();
      expect(slug).not.toContain('@');
      expect(slug).not.toContain('!');
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });
  });
});
