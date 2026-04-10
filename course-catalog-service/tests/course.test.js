const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');

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

// Generate a random dynamic secret so SonarQube doesn't flag a hardcoded string
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

const validToken = jwt.sign(
  { id: 'user1', email: 'test@test.com', role: 'instructor', name: 'Dr. Silva' },
  process.env.JWT_SECRET
);

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
});

describe('GET /api/courses/:id', () => {
  it('should return a course by ID', async () => {
    const res = await request(app).get('/api/courses/64f1a2b3c4d5e6f7a8b9c0d1');
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Node.js Fundamentals');
  });

  it('should return 404 for non-existent course', async () => {
    const Course = require('../src/models/Course');
    Course.findById.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/courses/000000000000000000000000');
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Course not found');
  });
});

describe('POST /api/courses', () => {
  const validBody = {
    title:       'Node.js Fundamentals',
    description: 'Learn Node.js and Express from scratch',
    instructor:  'Dr. Silva',
    category:    'Programming',
    duration:    '8 weeks',
    totalSeats:  30,
  };

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
    const Course = require('../src/models/Course');
    Course.findByIdAndUpdate.mockResolvedValueOnce(null);
    const res = await request(app)
      .put('/api/courses/000000000000000000000000')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'Test' });
    expect(res.statusCode).toBe(404);
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
    const Course = require('../src/models/Course');
    Course.findByIdAndUpdate.mockResolvedValueOnce(null);
    const res = await request(app)
      .put('/api/courses/000000000000000000000000/seats')
      .send({ action: 'increment' });
    expect(res.statusCode).toBe(404);
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
    const Course = require('../src/models/Course');
    Course.findByIdAndDelete.mockResolvedValueOnce(null);
    const res = await request(app)
      .delete('/api/courses/000000000000000000000000')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.statusCode).toBe(404);
  });
});