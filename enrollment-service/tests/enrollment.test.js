//INTEGRATION TEST ---> It tests how the app.js, routes, and controllers work together.

const request = require('supertest');
const app = require('../src/app');
const axios = require('axios');

// Mock mongoose
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(true),
  };
});

// Mock Enrollment Model
jest.mock('../src/models/Enrollment', () => ({
  create: jest.fn().mockResolvedValue({
    _id: 'enroll123',
    userId: 'user1',
    courseId: 'course1',
    courseTitle: 'Node.js'
  }),
  find: jest.fn().mockResolvedValue([]),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOne: jest.fn().mockResolvedValue(null), // No duplicate by default
}));

// Mock Axios for inter-service communication
jest.mock('axios');

describe('Enrollment Service', () => {
  const validToken = 'Bearer mock-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/enrollment', () => {
    it('should enroll a student successfully', async () => {
      // 1. Mock Auth Service Validation 
      axios.get.mockResolvedValueOnce({
        data: { valid: true, user: { id: 'user1', name: 'John', email: 'john@test.com' } }
      });

      // 2. Mock Course Service response 
      axios.get.mockResolvedValueOnce({
        data: { _id: 'course1', title: 'Node.js', enrolledCount: 5, totalSeats: 20, instructor: 'Dr. Silva' }
      });

      // 3. Mock Seat Update 
      axios.put.mockResolvedValueOnce({ data: { success: true } });

      // 4. Mock Notification  
      axios.post.mockResolvedValueOnce({ data: { message: 'sent' } });

      const res = await request(app)
        .post('/api/enrollment')
        .set('Authorization', validToken)
        .send({ courseId: 'course1' });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Enrolled successfully'); 
      expect(res.body.enrollment).toBeDefined();
    });

    it('should return 401 if token is invalid', async () => {
      axios.get.mockResolvedValueOnce({ data: { valid: false } });  

      const res = await request(app)
        .post('/api/enrollment')
        .set('Authorization', 'Bearer invalid')
        .send({ courseId: 'course1' });

      expect(res.statusCode).toBe(401);
    });

    it('should return 400 if course is full', async () => {
      axios.get.mockResolvedValueOnce({ data: { valid: true, user: { id: '1' } } });
      axios.get.mockResolvedValueOnce({
        data: { _id: 'course1', enrolledCount: 20, totalSeats: 20 }
      });  

      const res = await request(app)
        .post('/api/enrollment')
        .set('Authorization', validToken)
        .send({ courseId: 'course1' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Course is full');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.service).toBe('enrollment-service'); 
    });
  });

  describe('GET /api/enrollment/user/:userId', () => {
    it('should return list of enrollments for a user', async () => {
      const mockEnrollments = [
        { userId: 'user1', courseId: 'course1', courseTitle: 'Node.js' }
      ];
      // Override the find mock for this specific test
      const Enrollment = require('../src/models/Enrollment');
      Enrollment.find.mockResolvedValueOnce(mockEnrollments);

      const res = await request(app).get('/api/enrollment/user/user1');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].courseTitle).toBe('Node.js');
    });
  });

  describe('GET /api/enrollment/:id', () => {
    it('should return enrollment details if found', async () => {
      const Enrollment = require('../src/models/Enrollment');
      Enrollment.findById.mockResolvedValueOnce({ _id: 'enroll123', courseTitle: 'Node.js' });

      const res = await request(app).get('/api/enrollment/enroll123');

      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe('enroll123');
    });

    it('should return 404 if enrollment not found', async () => {
      const Enrollment = require('../src/models/Enrollment');
      Enrollment.findById.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/enrollment/wrongid');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Not found');
    });
  });

  describe('DELETE /api/enrollment/:id', () => {
    it('should cancel enrollment and decrement seats', async () => {
      const Enrollment = require('../src/models/Enrollment');
      Enrollment.findByIdAndUpdate.mockResolvedValueOnce({ 
        _id: 'enroll123', 
        courseId: 'course1', 
        status: 'cancelled' 
      });

      // Mock Course Service seat decrement
      axios.put.mockResolvedValueOnce({ data: { success: true } });

      const res = await request(app).delete('/api/enrollment/enroll123');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Enrollment cancelled');
      expect(axios.put).toHaveBeenCalled(); // Verify seat update was triggered
    });
  });

  describe('PUT /api/enrollment/:id/progress', () => {
    it('should update progress percentage', async () => {
      const Enrollment = require('../src/models/Enrollment');
      Enrollment.findByIdAndUpdate.mockResolvedValueOnce({ 
        _id: 'enroll123', 
        progress: 50 
      });

      const res = await request(app)
        .put('/api/enrollment/enroll123/progress')
        .send({ progress: 50 });

      expect(res.statusCode).toBe(200);
      expect(res.body.progress).toBe(50);
    });
  });
  
});