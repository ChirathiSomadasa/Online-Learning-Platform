const request = require('supertest');
const app = require('../src/app');

// Mock mongoose so tests run without a real DB
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(true),
  };
});

// Mock the Course model
jest.mock('../src/models/Course', () => {
  const mockCourse = {
    _id: '64f1a2b3c4d5e6f7a8b9c0d1',
    title: 'Node.js Fundamentals',
    description: 'Learn Node.js and Express from scratch',
    instructor: 'Dr. Silva',
    instructorId: '64f1a2b3c4d5e6f7a8b9c0d1',
    category: 'Programming',
    duration: '8 weeks',
    totalSeats: 30,
    enrolledCount: 0,
    status: 'active',
    createdAt: new Date(),
  };

  return {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([mockCourse]),
    }),
    findById: jest.fn().mockResolvedValue(mockCourse),
    create: jest.fn().mockResolvedValue(mockCourse),
    findByIdAndUpdate: jest.fn().mockResolvedValue(mockCourse),
    findByIdAndDelete: jest.fn().mockResolvedValue(mockCourse),
  };
});

// Mock axios (notification calls)
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: { message: 'ok' } }),
}));

// Mock JWT for protected routes
process.env.JWT_SECRET = 'test-secret';
const jwt = require('jsonwebtoken');
const validToken = jwt.sign(
  { id: 'user1', email: 'test@test.com', role: 'instructor', name: 'Test User' },
  'test-secret'
);

describe('Course Catalog Service', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('course-catalog-service');
    });
  });

  describe('GET /api/courses', () => {
    it('should return list of courses', async () => {
      const res = await request(app).get('/api/courses');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should return a course by id', async () => {
      const res = await request(app).get('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1');
      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Node.js Fundamentals');
    });
  });

  describe('POST /api/courses', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).post('/api/courses').send({
        title: 'Test Course',
        description: 'Test',
        instructor: 'Dr. Test',
        category: 'Testing',
      });
      expect(res.statusCode).toBe(401);
    });

    it('should create a course with valid JWT', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Node.js Fundamentals',
          description: 'Learn Node.js and Express from scratch',
          instructor: 'Dr. Silva',
          instructorId: '64f1a2b3c4d5e6f7a8b9c0d1',
          category: 'Programming',
          duration: '8 weeks',
          totalSeats: 30,
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Course created successfully');
    });
  });

  describe('PUT /api/courses/:id/seats', () => {
    it('should increment seat count', async () => {
      const res = await request(app)
        .put('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1/seats')
        .send({ action: 'increment' });
      expect(res.statusCode).toBe(200);
    });

    it('should reject invalid action', async () => {
      const res = await request(app)
        .put('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1/seats')
        .send({ action: 'invalid' });
      expect(res.statusCode).toBe(400);
    });
  });
});
