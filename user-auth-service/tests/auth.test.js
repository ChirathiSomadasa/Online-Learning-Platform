const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

jest.mock('../src/models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('axios');

// Helper to mock chained Mongoose queries like .select('-password')
const mockQuery = (data) => ({
  select: jest.fn().mockResolvedValue(data)
});

describe('Auth Service - Complete Coverage Suite', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // 1. HEALTH CHECK
  // ==========================================
  describe('GET /health', () => {
    test('should return ok', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
    });
  });

  // ==========================================
  // 2. REGISTER
  // ==========================================
  describe('POST /api/auth/register', () => {
    test('1. Fails on invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'bademail', name: 'Test' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid email address');
    });

    test('2. Fails on missing name', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Name is required');
    });

    test('3. Fails on missing/short password', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com', name: 'Test', password: '123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Password must be at least 6 characters');
    });

    // Covers role validation
    test('4. Fails on invalid role', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@test.com', name: 'Test', password: 'password123', role: 'admin'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Role must be student or instructor');
    });

    // Covers required securityQuestion
    test('5. Fails on missing security question', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@test.com', name: 'Test', password: 'password123'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Security question is required');
    });

    // Covers required securityAnswer
    test('6. Fails on missing security answer', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@test.com', name: 'Test', password: 'password123',
        securityQuestion: 'Pet name?'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Security answer is required');
    });

    test('7. Fails if email already registered', async () => {
      User.findOne.mockResolvedValue({ email: 'test@test.com' });
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@test.com', name: 'Test', password: 'password123',
        securityQuestion: 'Pet name?', securityAnswer: 'Fluffy'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Email already registered');
    });

    test('8. Fails on DB error', async () => {
      User.findOne.mockRejectedValue(new Error('DB crash'));
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@test.com', name: 'Test', password: 'password123',
        securityQuestion: 'Pet name?', securityAnswer: 'Fluffy'
      });
      expect(res.statusCode).toBe(500);
    });

    test('9. Succeeds with all required fields and sends notification', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ _id: '1', name: 'Test', email: 'test@test.com', role: 'student' });
      bcrypt.hash.mockResolvedValue('hashed');
      jwt.sign.mockReturnValue('token');
      axios.post.mockResolvedValue(true);

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@test.com', name: 'Test', password: 'password123',
        securityQuestion: 'Pet name?', securityAnswer: 'Fluffy'
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.token).toBe('token');
    });

    test('10. Succeeds even if notification service fails (Catch block)', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ _id: '1', name: 'Test', email: 't@t.com', role: 'student' });
      bcrypt.hash.mockResolvedValue('hashed');
      jwt.sign.mockReturnValue('token');
      axios.post.mockRejectedValue(new Error('Network Error'));

      const res = await request(app).post('/api/auth/register').send({
        email: 't@t.com', name: 'Test', password: 'password123',
        securityQuestion: 'Pet name?', securityAnswer: 'Fluffy'
      });
      expect(res.statusCode).toBe(201);
    });

    test('11. Succeeds with instructor role', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ _id: '1', name: 'Test', email: 'test@test.com', role: 'instructor' });
      bcrypt.hash.mockResolvedValue('hashed');
      jwt.sign.mockReturnValue('token');
      axios.post.mockResolvedValue(true);

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@test.com', name: 'Test', password: 'password123',
        role: 'instructor', securityQuestion: 'Pet name?', securityAnswer: 'Fluffy'
      });
      expect(res.statusCode).toBe(201);
    });

    // Covers sanitizeEmail typeof check (line 8 in authController)
    test('12. Fails when email is a non-string type', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 12345, name: 'Test', password: 'password123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid email address');
    });
  });

  // ==========================================
  // 3. LOGIN & VALIDATE
  // ==========================================
  describe('POST /api/auth/login', () => {
    test('1. Fails on invalid email', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'bad' });
      expect(res.statusCode).toBe(400);
    });

    test('2. Fails on missing password', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com' });
      expect(res.statusCode).toBe(400);
    });

    test('3. Fails if user not found', async () => {
      User.findOne.mockResolvedValue(null);
      const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com', password: 'pw' });
      expect(res.statusCode).toBe(401);
    });

    test('4. Fails on wrong password', async () => {
      User.findOne.mockResolvedValue({ password: 'hashed' });
      bcrypt.compare.mockResolvedValue(false);
      const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com', password: 'wrong' });
      expect(res.statusCode).toBe(401);
    });

    test('5. Succeeds on correct credentials', async () => {
      User.findOne.mockResolvedValue({ _id: '1', password: 'hashed', name: 'Test', role: 'student' });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token');
      const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com', password: 'pw' });
      expect(res.statusCode).toBe(200);
    });

    test('6. Server error', async () => {
      User.findOne.mockRejectedValue(new Error('DB crash'));
      const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com', password: 'pw' });
      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /api/auth/validate', () => {
    test('1. Fails without token', async () => {
      const res = await request(app).get('/api/auth/validate');
      expect(res.statusCode).toBe(401);
      expect(res.body.valid).toBe(false);
    });

    test('2. Fails with bad token', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('Bad token'); });
      const res = await request(app).get('/api/auth/validate').set('Authorization', 'Bearer bad');
      expect(res.statusCode).toBe(401);
    });

    test('3. Succeeds with good token', async () => {
      jwt.verify.mockReturnValue({ id: '1' });
      const res = await request(app).get('/api/auth/validate').set('Authorization', 'Bearer good');
      expect(res.statusCode).toBe(200);
      expect(res.body.valid).toBe(true);
    });
  });

  // ==========================================
  // 4. FORGOT PASSWORD
  // ==========================================
  describe('Forgot Password Routes', () => {
    test('Question - Fails on invalid email', async () => {
      const res = await request(app).post('/api/auth/forgot-password/question').send({ email: 'bad' });
      expect(res.statusCode).toBe(400);
    });

    test('Question - Fails if user not found', async () => {
      User.findOne.mockResolvedValue(null);
      const res = await request(app).post('/api/auth/forgot-password/question').send({ email: 't@t.com' });
      expect(res.statusCode).toBe(404);
    });

    test('Question - Fails if no question set', async () => {
      User.findOne.mockResolvedValue({ securityQuestion: '' });
      const res = await request(app).post('/api/auth/forgot-password/question').send({ email: 't@t.com' });
      expect(res.statusCode).toBe(400);
    });

    test('Question - Succeeds', async () => {
      User.findOne.mockResolvedValue({ securityQuestion: 'Pet?' });
      const res = await request(app).post('/api/auth/forgot-password/question').send({ email: 't@t.com' });
      expect(res.statusCode).toBe(200);
      expect(res.body.securityQuestion).toBe('Pet?');
    });

    test('Question - Server error', async () => {
      User.findOne.mockRejectedValue(new Error('DB'));
      const res = await request(app).post('/api/auth/forgot-password/question').send({ email: 't@t.com' });
      expect(res.statusCode).toBe(500);
    });

    test('Reset - Fails on invalid email/answer/password', async () => {
      let res = await request(app).post('/api/auth/forgot-password/reset').send({ email: 'bad' });
      expect(res.statusCode).toBe(400);
      res = await request(app).post('/api/auth/forgot-password/reset').send({ email: 't@t.com', securityAnswer: '' });
      expect(res.statusCode).toBe(400);
      res = await request(app).post('/api/auth/forgot-password/reset').send({ email: 't@t.com', securityAnswer: 'A', newPassword: '123' });
      expect(res.statusCode).toBe(400);
    });

    test('Reset - Fails if user not found', async () => {
      User.findOne.mockResolvedValue(null);
      const res = await request(app).post('/api/auth/forgot-password/reset').send({ email: 't@t.com', securityAnswer: 'A', newPassword: 'password123' });
      expect(res.statusCode).toBe(404);
    });

    test('Reset - Fails on wrong answer', async () => {
      User.findOne.mockResolvedValue({ securityAnswer: 'hashed' });
      bcrypt.compare.mockResolvedValue(false);
      const res = await request(app).post('/api/auth/forgot-password/reset').send({ email: 't@t.com', securityAnswer: 'wrong', newPassword: 'password123' });
      expect(res.statusCode).toBe(401);
    });

    test('Reset - Succeeds', async () => {
      const mockUser = { securityAnswer: 'hashed', save: jest.fn().mockResolvedValue(true) };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('newHashed');

      const res = await request(app).post('/api/auth/forgot-password/reset').send({ email: 't@t.com', securityAnswer: 'correct', newPassword: 'password123' });
      expect(res.statusCode).toBe(200);
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('Reset - Server error', async () => {
      User.findOne.mockRejectedValue(new Error('DB'));
      const res = await request(app).post('/api/auth/forgot-password/reset').send({ email: 't@t.com', securityAnswer: 'correct', newPassword: 'password123' });
      expect(res.statusCode).toBe(500);
    });
  });

  // ==========================================
  // 5. PROTECTED ROUTES & MIDDLEWARE
  // ==========================================
  describe('Protected Routes (Profile Management)', () => {

    // Covers authMiddleware.js line 5 — no token provided
    test('Middleware - Fails without token header', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('No token provided');
    });

    // Covers authMiddleware.js line 10 — catch block (invalid/expired token)
    test('Middleware - Fails with invalid token (covers catch block line 10)', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid or expired token');
    });

    describe('With Valid Token', () => {
      beforeEach(() => {
        jwt.verify.mockReturnValue({ id: '123' }); // Bypass middleware for these tests
      });

      test('GET Profile - Fails if user not found', async () => {
        User.findById.mockReturnValue(mockQuery(null));
        const res = await request(app).get('/api/auth/profile').set('Authorization', 'Bearer token');
        expect(res.statusCode).toBe(404);
      });

      test('GET Profile - Succeeds', async () => {
        User.findById.mockReturnValue(mockQuery({ name: 'Test' }));
        const res = await request(app).get('/api/auth/profile').set('Authorization', 'Bearer token');
        expect(res.statusCode).toBe(200);
      });

      test('GET Profile - Server error', async () => {
        User.findById.mockImplementation(() => { throw new Error('DB'); });
        const res = await request(app).get('/api/auth/profile').set('Authorization', 'Bearer token');
        expect(res.statusCode).toBe(500);
      });

      test('PUT Profile - Invalid input', async () => {
        let res = await request(app).put('/api/auth/profile').set('Authorization', 'Bearer token').send({ email: 'bad' });
        expect(res.statusCode).toBe(400);
        res = await request(app).put('/api/auth/profile').set('Authorization', 'Bearer token').send({ email: 't@t.com' });
        expect(res.statusCode).toBe(400);
      });

      test('PUT Profile - Email in use', async () => {
        User.findOne.mockResolvedValue({ _id: 'otherId' });
        const res = await request(app).put('/api/auth/profile').set('Authorization', 'Bearer token').send({ email: 't@t.com', name: 'Test' });
        expect(res.statusCode).toBe(400);
      });

      test('PUT Profile - User not found during update', async () => {
        User.findOne.mockResolvedValue(null);
        User.findByIdAndUpdate.mockReturnValue(mockQuery(null));
        const res = await request(app).put('/api/auth/profile').set('Authorization', 'Bearer token').send({ email: 't@t.com', name: 'Test' });
        expect(res.statusCode).toBe(404);
      });

      test('PUT Profile - Succeeds', async () => {
        User.findOne.mockResolvedValue(null);
        User.findByIdAndUpdate.mockReturnValue(mockQuery({ name: 'Updated' }));
        const res = await request(app).put('/api/auth/profile').set('Authorization', 'Bearer token').send({ email: 't@t.com', name: 'Test' });
        expect(res.statusCode).toBe(200);
      });

      test('PUT Profile - Server error', async () => {
        User.findOne.mockRejectedValue(new Error('DB'));
        const res = await request(app).put('/api/auth/profile').set('Authorization', 'Bearer token').send({ email: 't@t.com', name: 'Test' });
        expect(res.statusCode).toBe(500);
      });

      test('PUT Password - Invalid input', async () => {
        let res = await request(app).put('/api/auth/profile/password').set('Authorization', 'Bearer token').send({});
        expect(res.statusCode).toBe(400);
        res = await request(app).put('/api/auth/profile/password').set('Authorization', 'Bearer token').send({ currentPassword: 'pw' });
        expect(res.statusCode).toBe(400);
      });

      test('PUT Password - User not found', async () => {
        User.findById.mockResolvedValue(null);
        const res = await request(app).put('/api/auth/profile/password').set('Authorization', 'Bearer token').send({ currentPassword: 'pw', newPassword: 'password123' });
        expect(res.statusCode).toBe(404);
      });

      test('PUT Password - Wrong current password', async () => {
        User.findById.mockResolvedValue({ password: 'oldHashed' });
        bcrypt.compare.mockResolvedValue(false);
        const res = await request(app).put('/api/auth/profile/password').set('Authorization', 'Bearer token').send({ currentPassword: 'wrong', newPassword: 'password123' });
        expect(res.statusCode).toBe(401);
      });

      test('PUT Password - Succeeds', async () => {
        const mockUser = { password: 'oldHashed', save: jest.fn().mockResolvedValue(true) };
        User.findById.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        bcrypt.hash.mockResolvedValue('newHashed');
        const res = await request(app).put('/api/auth/profile/password').set('Authorization', 'Bearer token').send({ currentPassword: 'old', newPassword: 'password123' });
        expect(res.statusCode).toBe(200);
      });

      test('PUT Password - Server error', async () => {
        User.findById.mockRejectedValue(new Error('DB'));
        const res = await request(app).put('/api/auth/profile/password').set('Authorization', 'Bearer token').send({ currentPassword: 'old', newPassword: 'password123' });
        expect(res.statusCode).toBe(500);
      });

      test('DELETE Profile - User not found', async () => {
        User.findByIdAndDelete.mockResolvedValue(null);
        const res = await request(app).delete('/api/auth/profile').set('Authorization', 'Bearer token');
        expect(res.statusCode).toBe(404);
      });

      test('DELETE Profile - Succeeds', async () => {
        User.findByIdAndDelete.mockResolvedValue({ _id: '1' });
        const res = await request(app).delete('/api/auth/profile').set('Authorization', 'Bearer token');
        expect(res.statusCode).toBe(200);
      });

      test('DELETE Profile - Server error', async () => {
        User.findByIdAndDelete.mockRejectedValue(new Error('DB'));
        const res = await request(app).delete('/api/auth/profile').set('Authorization', 'Bearer token');
        expect(res.statusCode).toBe(500);
      });
    });
  });

});