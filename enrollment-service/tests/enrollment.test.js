const request = require('supertest');
const app = require('../src/app');
const Enrollment = require('../src/models/Enrollment');
const axios = require('axios');
const mongoose = require('mongoose');

jest.mock('../src/models/Enrollment');
jest.mock('axios');

describe('Enrollment Service - Complete Coverage Suite', () => {

  const validId = '64f1a2b3c4d5e6f7a8b9c0d1';
  const validToken = 'Bearer mock-token';

  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.Types.ObjectId.isValid = jest.fn((id) => {
      return id.length === 24; 
    });
  });

  // 1. HEALTH CHECK
  describe('GET /health', () => {
    test('should return ok', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  // 2. CREATE ENROLLMENT
  describe('POST /api/enrollment', () => {
    test('1. Fails on invalid courseId', async () => {
      const res = await request(app)
        .post('/api/enrollment')
        .send({ courseId: 'short' }); 

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid course ID format');
    });

    test('2. Fails without token', async () => {
      const res = await request(app)
        .post('/api/enrollment')
        .send({ courseId: validId });
      expect(res.statusCode).toBe(401);
    });

    test('3. Fails if user unauthorized', async () => {
      axios.get.mockResolvedValueOnce({ data: { valid: false } });
      const res = await request(app)
        .post('/api/enrollment')
        .set('Authorization', validToken)
        .send({ courseId: validId });
      expect(res.statusCode).toBe(401);
    });

    test('4. Fails if course is full', async () => {
      axios.get.mockResolvedValueOnce({ data: { valid: true, user: { id: 'u1' } } }); // Auth
      axios.get.mockResolvedValueOnce({ data: { enrolledCount: 10, totalSeats: 10 } }); // Course

      const res = await request(app)
        .post('/api/enrollment')
        .set('Authorization', validToken)
        .send({ courseId: validId });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Course is full');
    });

    test('5. Succeeds and calls notification service', async () => {
      axios.get.mockResolvedValueOnce({ data: { valid: true, user: { id: 'u1', name: 'John', email: 'j@test.com' } } });
      axios.get.mockResolvedValueOnce({ data: { title: 'Node', enrolledCount: 0, totalSeats: 10, instructor: 'Dr. Smith' } });
      Enrollment.findOne.mockResolvedValue(null);
      Enrollment.create.mockResolvedValue({ _id: validId });
      axios.put.mockResolvedValue({ data: { success: true } });
      axios.post.mockResolvedValue({ data: { sent: true } });

      const res = await request(app)
        .post('/api/enrollment')
        .set('Authorization', validToken)
        .send({ courseId: validId });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Enrolled successfully');
    });

    test('6. Server error', async () => {
      axios.get.mockRejectedValue(new Error('Crash'));
      const res = await request(app)
        .post('/api/enrollment')
        .set('Authorization', validToken)
        .send({ courseId: validId });
      expect(res.statusCode).toBe(500);
    });

    test('7. Succeeds even if seat update or notification fails', async () => {
      axios.get.mockResolvedValueOnce({ data: { valid: true, user: { id: 'u1' } } });
      axios.get.mockResolvedValueOnce({ data: { title: 'Node', enrolledCount: 0, totalSeats: 10 } });
      Enrollment.findOne.mockResolvedValue(null);
      Enrollment.create.mockResolvedValue({ _id: validId });

      axios.put.mockRejectedValue(new Error('Seat update failed'));
      axios.post.mockRejectedValue(new Error('Notification failed'));

      const res = await request(app)
        .post('/api/enrollment')
        .set('Authorization', validToken)
        .send({ courseId: validId });

      expect(res.statusCode).toBe(201);
    });


    test('8. Fails if already enrolled', async () => {
      axios.get.mockResolvedValueOnce({ data: { valid: true, user: { id: 'u1' } } });
      axios.get.mockResolvedValueOnce({ data: { title: 'Node', enrolledCount: 0, totalSeats: 10 } });
      Enrollment.findOne.mockResolvedValue({ _id: 'some-id' }); 

      const res = await request(app)
        .post('/api/enrollment')
        .set('Authorization', validToken)
        .send({ courseId: validId });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Already enrolled');
    });
  });

  // 3. GET ENROLLMENTS
  describe('GET Enrollments', () => {
    test('User Enrollments - Succeeds', async () => {
      Enrollment.find.mockResolvedValue([]);
      const res = await request(app).get(`/api/enrollment/user/${validId}`);
      expect(res.statusCode).toBe(200);
    });

    test('ID Search - Fails on invalid ID', async () => {
      const res = await request(app).get('/api/enrollment/bad-id');
      expect(res.statusCode).toBe(400);
    });

    test('ID Search - Fails if not found', async () => {
      Enrollment.findById.mockResolvedValue(null);
      const res = await request(app).get(`/api/enrollment/${validId}`);
      expect(res.statusCode).toBe(404);
    });

    test('ID Search - Succeeds', async () => {
      Enrollment.findById.mockResolvedValue({ _id: validId });
      const res = await request(app).get(`/api/enrollment/${validId}`);
      expect(res.statusCode).toBe(200);
    });

    test('ID Search - Server Error', async () => {
      Enrollment.findById.mockRejectedValue(new Error('DB Error'));
      const res = await request(app).get(`/api/enrollment/${validId}`);
      expect(res.statusCode).toBe(500); 
    });

    test('User Enrollments - Server Error', async () => {
      Enrollment.find.mockRejectedValue(new Error('DB Error'));
      const res = await request(app).get(`/api/enrollment/user/${validId}`);
      expect(res.statusCode).toBe(500); 
    });
  });

  // 4. CANCEL & PROGRESS
  describe('Update/Delete Enrollments', () => {
    test('Cancel - Fails if not found', async () => {
      Enrollment.findByIdAndUpdate.mockResolvedValue(null);
      const res = await request(app).delete(`/api/enrollment/${validId}`);
      expect(res.statusCode).toBe(404);
    });

    test('Cancel - Succeeds', async () => {
      Enrollment.findByIdAndUpdate.mockResolvedValue({ _id: validId, courseId: validId });
      axios.put.mockResolvedValue({ data: { success: true } });
      const res = await request(app).delete(`/api/enrollment/${validId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Enrollment cancelled');
    });

    test('Cancel - Invalid ID format', async () => {
      const res = await request(app).delete('/api/enrollment/invalid-id');
      expect(res.statusCode).toBe(400); 
    });

    test('Cancel - Seat update fail logs warning', async () => {
      Enrollment.findByIdAndUpdate.mockResolvedValue({ _id: validId, courseId: validId });
      axios.put.mockRejectedValue(new Error('Async Seat Fail')); 
      const res = await request(app).delete(`/api/enrollment/${validId}`);
      expect(res.statusCode).toBe(200); 
    });

    test('Cancel - Server Error', async () => {
      Enrollment.findByIdAndUpdate.mockRejectedValue(new Error('Database error on cancel'));

      const res = await request(app)
        .delete(`/api/enrollment/${validId}`);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database error on cancel');
    });

    test('Progress - Invalid ID format', async () => {
      const res = await request(app).put('/api/enrollment/123/progress').send({ progress: 10 });
      expect(res.statusCode).toBe(400); 
    });

    test('Progress - Not Found', async () => {
      Enrollment.findByIdAndUpdate.mockResolvedValue(null);
      const res = await request(app).put(`/api/enrollment/65f1a2b3c4d5e6f7a8b9c0d1/progress`).send({ progress: 10 });
      expect(res.statusCode).toBe(404); 
    });

    test('Progress - Server Error', async () => {
      Enrollment.findByIdAndUpdate.mockRejectedValue(new Error('Database Crash'));

      const res = await request(app)
        .put(`/api/enrollment/${validId}/progress`)
        .send({ progress: 100 });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database Crash');
    });

    test('Progress - Succeeds', async () => {
      Enrollment.findByIdAndUpdate.mockResolvedValue({ _id: validId, progress: 50 });
      const res = await request(app)
        .put(`/api/enrollment/${validId}/progress`)
        .send({ progress: 50 });
      expect(res.statusCode).toBe(200);
      expect(res.body.progress).toBe(50);
    });

    test('Progress - Server error', async () => {
      Enrollment.findByIdAndUpdate.mockRejectedValue(new Error('DB'));
      const res = await request(app)
        .put(`/api/enrollment/${validId}/progress`)
        .send({ progress: 10 });
      expect(res.statusCode).toBe(500);
    });
  });
  
  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterAll(() => {
    console.warn.mockRestore();
  });
});