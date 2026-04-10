const request = require('supertest');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');

// ============================================================================
// 1. GLOBAL MOCKS & SETUP
// ============================================================================

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return { ...actual, connect: jest.fn().mockResolvedValue(true) };
});

jest.mock('../src/models/Course', () => {
  const mockCourse = {
    _id:           '64f1a2b3c4d5e6f7a8b9c0d1',
    title:         'Node.js Fundamentals',
    description:   'Learn Node.js and Express from scratch',
    instructor:    'Dr. Silva',
    instructorId:  '64f1a2b3c4d5e6f7a8b9c0d1',
    category:      'Programming',
    duration:      '8 weeks',
    totalSeats:    30,
    enrolledCount: 0,
    status:        'active',
    createdAt:     new Date(),
  };
  return {
    find:              jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([mockCourse]) }),
    findById:          jest.fn().mockResolvedValue(mockCourse),
    create:            jest.fn().mockResolvedValue(mockCourse),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockCourse),
    findByIdAndDelete: jest.fn().mockResolvedValue(mockCourse),
  };
});

jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: { message: 'ok' } }),
}));

const Course = require('../src/models/Course');
const axios = require('axios');
const app = require('../src/app');
const { requireAuth, softAuth } = require('../src/middleware/authMiddleware');

// Generate a dynamic secret for testing
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

const validToken = jwt.sign(
  { id: 'user1', email: 'test@test.com', role: 'instructor', name: 'Dr. Silva' },
  process.env.JWT_SECRET
);

const validBody = {
  title:       'Node.js Fundamentals',
  description: 'Learn Node.js and Express from scratch',
  instructor:  'Dr. Silva',
  category:    'Programming',
  duration:    '8 weeks',
  totalSeats:  30,
};

// ============================================================================
// 2. MIDDLEWARE TESTS (Coverage for src/middleware/authMiddleware.js)
// ============================================================================

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  describe('requireAuth', () => {
    it('should return 401 if token is invalid', () => {
      req.headers.authorization = 'Bearer FAKE_BAD_TOKEN';
      requireAuth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    });
  });

  describe('softAuth', () => {
    it('should call next() if no token is provided', () => {
      softAuth(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should verify token and attach user if token is valid', () => {
      req.headers.authorization = `Bearer ${validToken}`;
      softAuth(req, res, next);
      expect(req.user.id).toBe('user1');
      expect(next).toHaveBeenCalled();
    });

    it('should ignore invalid token, NOT attach user, and call next()', () => {
      req.headers.authorization = 'Bearer INVALID_TOKEN';
      softAuth(req, res, next);
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// 3. APP CONFIGURATION TESTS (Coverage for src/app.js CORS logic)
// ============================================================================

describe('App Configuration (CORS)', () => {
  it('should hit the default ALLOWED_ORIGINS branch', async () => {
    let isolatedApp;
    jest.isolateModules(() => {
      const prev = process.env.ALLOWED_ORIGINS;
      delete process.env.ALLOWED_ORIGINS;
      isolatedApp = require('../src/app');
      process.env.ALLOWED_ORIGINS = prev;
    });
    const res = await request(isolatedApp).get('/health').set('Origin', 'http://localhost:3000');
    expect(res.statusCode).toBe(200);
  });

  it('should hit the custom ALLOWED_ORIGINS branch', async () => {
    let isolatedApp;
    jest.isolateModules(() => {
      const prev = process.env.ALLOWED_ORIGINS;
      process.env.ALLOWED_ORIGINS = 'http://custom.com,http://test.com';
      isolatedApp = require('../src/app');
      process.env.ALLOWED_ORIGINS = prev;
    });
    const res = await request(isolatedApp).get('/health').set('Origin', 'http://custom.com');
    expect(res.statusCode).toBe(200);
  });
});

// ============================================================================
// 4. API ROUTE TESTS (Coverage for src/controllers/courseController.js)
// ============================================================================

describe('GET /health', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('course-catalog-service');
  });
});

describe('GET /api/courses', () => {
  it('should return list of active courses', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should accept valid category filter', async () => {
    const res = await request(app).get('/api/courses?category=development');
    expect(res.statusCode).toBe(200);
  });

  it('should reject invalid category with 400', async () => {
    const res = await request(app).get('/api/courses?category=invalidcat');
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid category value');
  });

  it('should accept search filter', async () => {
    const res = await request(app).get('/api/courses?search=node');
    expect(res.statusCode).toBe(200);
  });

  it('should handle DB 500 errors gracefully', async () => {
    Course.find.mockImplementationOnce(() => { throw new Error('DB Error'); });
    const res = await request(app).get('/api/courses');
    expect(res.statusCode).toBe(500);
  });
});

describe('GET /api/courses/my-courses', () => {
  it('should return instructor courses with valid token', async () => {
    const res = await request(app)
      .get('/api/courses/my-courses')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/courses/my-courses');
    expect(res.statusCode).toBe(401);
  });

  it('should handle DB 500 errors gracefully', async () => {
    Course.find.mockImplementationOnce(() => { throw new Error('DB Error'); });
    const res = await request(app)
      .get('/api/courses/my-courses')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.statusCode).toBe(500);
  });
});

describe('GET /api/courses/:id', () => {
  it('should return a course by ID', async () => {
    const res = await request(app).get('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1');
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Node.js Fundamentals');
  });

  it('should return 404 for non-existent course', async () => {
    Course.findById.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/courses/000000000000000000000000');
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Course not found');
  });

  it('should handle DB 500 errors gracefully', async () => {
    Course.findById.mockRejectedValueOnce(new Error('DB Error'));
    const res = await request(app).get('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1');
    expect(res.statusCode).toBe(500);
  });
});

describe('POST /api/courses', () => {
  it('should handle JWT payloads that use _id instead of id (Coverage for Line 81)', async () => {
    // Create a token that only has _id, not id
    const altToken = jwt.sign(
      { _id: 'user_alt_id', email: 'alt@test.com', role: 'instructor' },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${altToken}`)
      .send(validBody);

    expect(res.statusCode).toBe(201);
  });
  
  it('should reject unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/courses').send(validBody);
    expect(res.statusCode).toBe(401);
  });

  it('should create course with valid instructor JWT', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validBody);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Course created successfully');
  });

  it('should handle notification service failure gracefully', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network Error'));
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validBody);
    expect(res.statusCode).toBe(201); // Creation succeeds even if notification fails
  });

  it('should handle DB 500 errors gracefully', async () => {
    Course.create.mockRejectedValueOnce(new Error('DB Error'));
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validBody);
    expect(res.statusCode).toBe(500);
  });
});

describe('PUT /api/courses/:id', () => {
  it('should update course with valid token', async () => {
    const res = await request(app)
      .put('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'Updated Title' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Course updated successfully');
  });

  it('should return 401 without token', async () => {
    const res = await request(app)
      .put('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1')
      .send({ title: 'Updated' });
    expect(res.statusCode).toBe(401);
  });

  it('should return 404 when course not found', async () => {
    Course.findByIdAndUpdate.mockResolvedValueOnce(null);
    const res = await request(app)
      .put('/api/courses/000000000000000000000000')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'Test' });
    expect(res.statusCode).toBe(404);
  });

  it('should handle DB 500 errors gracefully', async () => {
    Course.findByIdAndUpdate.mockRejectedValueOnce(new Error('DB Error'));
    const res = await request(app)
      .put('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'Test' });
    expect(res.statusCode).toBe(500);
  });
});

describe('PUT /api/courses/:id/seats', () => {
  it('should increment seat count', async () => {
    const res = await request(app)
      .put('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1/seats')
      .send({ action: 'increment' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Seat count updated');
  });

  it('should decrement seat count', async () => {
    const res = await request(app)
      .put('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1/seats')
      .send({ action: 'decrement' });
    expect(res.statusCode).toBe(200);
  });

  it('should reject invalid action with 400', async () => {
    const res = await request(app)
      .put('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1/seats')
      .send({ action: 'invalid' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('action must be increment or decrement');
  });

  it('should return 404 when course not found', async () => {
    Course.findByIdAndUpdate.mockResolvedValueOnce(null);
    const res = await request(app)
      .put('/api/courses/000000000000000000000000/seats')
      .send({ action: 'increment' });
    expect(res.statusCode).toBe(404);
  });

  it('should handle DB 500 errors gracefully', async () => {
    Course.findByIdAndUpdate.mockRejectedValueOnce(new Error('DB Error'));
    const res = await request(app)
      .put('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1/seats')
      .send({ action: 'increment' });
    expect(res.statusCode).toBe(500);
  });
});

describe('DELETE /api/courses/:id', () => {
  it('should delete course with valid token', async () => {
    const res = await request(app)
      .delete('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Course deleted successfully');
  });

  it('should return 401 without token', async () => {
    const res = await request(app)
      .delete('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1');
    expect(res.statusCode).toBe(401);
  });

  it('should return 404 when course not found', async () => {
    Course.findByIdAndDelete.mockResolvedValueOnce(null);
    const res = await request(app)
      .delete('/api/courses/000000000000000000000000')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.statusCode).toBe(404);
  });

  it('should handle DB 500 errors gracefully', async () => {
    Course.findByIdAndDelete.mockRejectedValueOnce(new Error('DB Error'));
    const res = await request(app)
      .delete('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.statusCode).toBe(500);
  });
});