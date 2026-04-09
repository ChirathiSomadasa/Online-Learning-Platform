const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');

// 1. Mock Stripe 
jest.mock('stripe', () => {
  const mockStripeInstance = {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    customers: {
      create: jest.fn(),
    },
  };
  return jest.fn(() => mockStripeInstance);
});

// 2. Mock axios & Payment 
jest.mock('axios', () => ({
  get: jest.fn(),
  // Must return a resolvable promise to prevent fire-and-forget .catch() from throwing unhandled rejections
  post: jest.fn().mockReturnValue(Promise.resolve({ data: {} })), 
}));
jest.mock('../src/models/Payment');

const stripe = require('stripe');
const axios = require('axios');
const Payment = require('../src/models/Payment');
const jwt = require('jsonwebtoken');

//  Helpers 
const getStripe = () => stripe.mock.results[0]?.value ?? stripe();

const mockFindOneChain = (result) => ({
  sort: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result),
});

const mockFindChain = (result) => ({
  sort: jest.fn().mockResolvedValue(result),
});

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 50));

//  ENV 
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.COURSE_SERVICE_URL = 'http://course-service';
process.env.ENROLLMENT_SERVICE_URL = 'http://enroll-service';
process.env.NOTIFICATION_SERVICE_URL = 'http://notify-service';
process.env.STRIPE_SECRET_KEY = 'sk_test';
process.env.MONGO_URI = 'mongodb://localhost:27017/test';
process.env.PORT = '3099';

const studentToken = jwt.sign(
  { id: 'user_student_1', email: 'student@test.com', name: 'Test Student' },
  process.env.JWT_SECRET,
);

// Setup & Teardown
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});

// Ensures open handles from stray timers/promises are flushed
afterAll(async () => {
  await mongoose.disconnect();
  await flushPromises();
});

// =============================================================================
// paymentController.js — Edge cases & Fallbacks
// =============================================================================
describe('paymentController.js coverage extensions', () => {

  test('handles null/undefined userName gracefully — covers sanitizeString line 20', async () => {
    const tokenNoName = jwt.sign(
      { id: 'user_no_name', email: 'noname@test.com' },
      process.env.JWT_SECRET,
    );

    axios.get.mockResolvedValueOnce({ data: { price: 50, title: 'Course' } });
    Payment.findOne
      .mockResolvedValueOnce(null)
      .mockReturnValueOnce(mockFindOneChain(null));
    axios.get.mockRejectedValueOnce(new Error('down'));
    getStripe().customers.create.mockResolvedValueOnce({ id: 'cus_1' });
    getStripe().paymentIntents.create.mockResolvedValueOnce({
      id: 'pi_1', client_secret: 'secret', currency: 'usd',
    });
    Payment.create.mockResolvedValueOnce({ _id: 'pay_1' });

    const res = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${tokenNoName}`)
      .send({ courseId: 'c1' });

    expect(res.statusCode).toBe(201);
  });

  test('creates new stripe customer when existing customer is NOT found — covers lines 88, 91', async () => {
    // Mock the external calls in exact order to hit the stripe.customers.create block
    axios.get.mockResolvedValueOnce({ data: { price: 50, title: 'Course' } });
    
    // 1st findOne: check for successful payment
    Payment.findOne.mockResolvedValueOnce(null);
    
    // 2nd get: check enrollment
    axios.get.mockResolvedValueOnce({ data: [] });
    
    // 3rd findOne: getOrCreateStripeCustomer check! Returns null to force creation
    Payment.findOne.mockReturnValueOnce(mockFindOneChain(null));

    getStripe().customers.create.mockResolvedValueOnce({ id: 'cus_new_created' });
    getStripe().paymentIntents.create.mockResolvedValueOnce({
      id: 'pi_1', client_secret: 's', currency: 'usd',
    });
    Payment.create.mockResolvedValueOnce({ _id: 'p1' });

    const res = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: 'c1' });

    expect(res.statusCode).toBe(201);
    expect(getStripe().customers.create).toHaveBeenCalled();
  });
});

// =============================================================================
// Auth Middleware Error Handling
// =============================================================================
describe('Auth Middleware Error Handling', () => {

  test('401 if token is invalid — covers authMiddleware lines 15-16', async () => {
    const res = await request(app)
      .get('/api/payments/my')
      .set('Authorization', 'Bearer invalid-token-here');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  test('401 if no Authorization header', async () => {
    const res = await request(app).get('/api/payments/my');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  test('401 if Authorization does not start with Bearer', async () => {
    const res = await request(app)
      .get('/api/payments/my')
      .set('Authorization', 'Basic abc123');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });
});

// =============================================================================
// Payment Model Hooks
// =============================================================================
describe('Payment Model Hooks', () => {
  test('should update updatedAt field on save — covers Payment.js line 43', async () => {
    const PaymentModel = jest.requireActual('../src/models/Payment');
    const payment = new PaymentModel({
      userId:    'u1',
      userEmail: 'u@test.com',
      courseId:  'c1',
      amount:    1000,
    });

    await Promise.all(
      payment.constructor.schema.s.hooks._pres
        .get('save')
        .map((hook) => hook.fn.call(payment)),
    );

    expect(payment.updatedAt).toBeDefined();
    expect(payment.updatedAt).toBeInstanceOf(Date);
  });
});

// =============================================================================
// API Routes
// =============================================================================

describe('GET /health', () => {
  test('returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });
});

describe('POST /api/payments/create-intent', () => {

  test('401 if no token', async () => {
    const res = await request(app).post('/api/payments/create-intent');
    expect(res.statusCode).toBe(401);
  });

  test('400 if courseId missing', async () => {
    const res = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  test('404 if course not found', async () => {
    axios.get.mockRejectedValueOnce(new Error('Not found'));
    const res = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: 'c1' });
    expect(res.statusCode).toBe(404);
  });

  test('400 if free course (price = 0)', async () => {
    axios.get.mockResolvedValueOnce({ data: { price: 0, title: 'Course' } });
    const res = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: 'c1' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('does not require payment');
  });

  test('400 if course price is null', async () => {
    axios.get.mockResolvedValueOnce({ data: { price: null, title: 'Course' } });
    const res = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: 'c1' });
    expect(res.statusCode).toBe(400);
  });

  test('400 if already paid', async () => {
    axios.get.mockResolvedValueOnce({ data: { price: 50, title: 'Course' } });
    Payment.findOne.mockResolvedValueOnce({ status: 'succeeded' });
    const res = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: 'c1' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Payment already completed');
  });

  test('400 if already enrolled in course', async () => {
    axios.get.mockResolvedValueOnce({ data: { price: 50, title: 'Course' } });
    Payment.findOne.mockResolvedValueOnce(null);
    axios.get.mockResolvedValueOnce({
      data: [{ courseId: 'c1', status: 'active' }],
    });
    const res = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: 'c1' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Already enrolled');
  });

  test('201 success even if enrollment service check fails', async () => {
    axios.get.mockResolvedValueOnce({ data: { price: 50, title: 'Course' } });
    Payment.findOne
      .mockResolvedValueOnce(null)
      .mockReturnValueOnce(mockFindOneChain(null));
    axios.get.mockRejectedValueOnce(new Error('Enrollment service down'));
    getStripe().customers.create.mockResolvedValueOnce({ id: 'cus_1' });
    getStripe().paymentIntents.create.mockResolvedValueOnce({
      id: 'pi_1', client_secret: 'secret', currency: 'usd',
    });
    Payment.create.mockResolvedValueOnce({ _id: 'pay_1' });
    const res = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: 'c1' });
    expect(res.statusCode).toBe(201);
  });

  test('201 success with existing stripe customer', async () => {
    axios.get.mockResolvedValueOnce({ data: { price: 50, title: 'Course' } });
    Payment.findOne
      .mockResolvedValueOnce(null)
      .mockReturnValueOnce(mockFindOneChain({ stripeCustomerId: 'cus_existing' }));
    axios.get.mockRejectedValueOnce(new Error('down'));
    getStripe().paymentIntents.create.mockResolvedValueOnce({
      id: 'pi_1', client_secret: 'secret', currency: 'usd',
    });
    Payment.create.mockResolvedValueOnce({ _id: 'pay_1' });
    const res = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: 'c1' });
    expect(res.statusCode).toBe(201);
    expect(getStripe().customers.create).not.toHaveBeenCalled();
  });

  test('500 on stripe error', async () => {
    axios.get.mockResolvedValueOnce({ data: { price: 50, title: 'Course' } });
    Payment.findOne
      .mockResolvedValueOnce(null)
      .mockReturnValueOnce(mockFindOneChain(null));
    axios.get.mockRejectedValueOnce(new Error('down'));
    getStripe().customers.create.mockRejectedValueOnce(new Error('Stripe error'));
    const res = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: 'c1' });
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toContain('failed');
  });
});

describe('POST /api/payments/confirm', () => {

  test('401 if no token', async () => {
    const res = await request(app).post('/api/payments/confirm');
    expect(res.statusCode).toBe(401);
  });

  test('400 if missing paymentIntentId', async () => {
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  test('404 if payment not found', async () => {
    Payment.findOne.mockResolvedValueOnce(null);
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentIntentId: 'pi_1' });
    expect(res.statusCode).toBe(404);
  });

  test('200 if already succeeded (idempotent)', async () => {
    Payment.findOne.mockResolvedValueOnce({
      status:                'succeeded',
      enrollmentId:          'enroll_1',
      userId:                'user_student_1',
      stripePaymentIntentId: 'pi_1',
    });
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentIntentId: 'pi_1' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('already confirmed');
  });

  test('400 if stripe payment failed with error details', async () => {
    const mockPay = {
      status: 'pending',
      save:   jest.fn().mockResolvedValue(true),
      userId: 'user_student_1',
      stripePaymentIntentId: 'pi_1',
    };
    Payment.findOne.mockResolvedValueOnce(mockPay);
    getStripe().paymentIntents.retrieve.mockResolvedValueOnce({
      status:             'requires_payment_method',
      last_payment_error: { code: 'card_declined', message: 'Card declined' },
    });
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentIntentId: 'pi_1' });
    expect(res.statusCode).toBe(400);
    expect(mockPay.save).toHaveBeenCalled();
  });

  test('400 if stripe payment failed without error details — covers lines 181-182', async () => {
    const mockPay = {
      status: 'pending',
      save:   jest.fn().mockResolvedValue(true),
      userId: 'user_student_1',
      stripePaymentIntentId: 'pi_1',
    };
    Payment.findOne.mockResolvedValueOnce(mockPay);
    getStripe().paymentIntents.retrieve.mockResolvedValueOnce({
      status: 'requires_action',
    });
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentIntentId: 'pi_1' });
    expect(res.statusCode).toBe(400);
    expect(mockPay.failureCode).toBe('unknown');
  });

  test('200 success confirm with enrollment and charge id — covers line 188 true branch', async () => {
    const mockPay = {
      status:                'pending',
      save:                  jest.fn().mockResolvedValue(true),
      userId:                'user_student_1',
      stripePaymentIntentId: 'pi_1',
      courseId:              'c1',
      userEmail:             'test@test.com',
      userName:              'Test',
      courseTitle:           'Course',
      amount:                5000,
      currency:              'usd',
      _id:                   'pay_1',
    };
    Payment.findOne.mockResolvedValueOnce(mockPay);
    getStripe().paymentIntents.retrieve.mockResolvedValueOnce({
      status:        'succeeded',
      latest_charge: 'ch_1',
    });
    axios.post.mockResolvedValueOnce({ data: { enrollment: { _id: 'enroll_1' } } });
    axios.post.mockResolvedValueOnce({}); // Notification mock
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentIntentId: 'pi_1' });
    expect(res.statusCode).toBe(200);
    expect(mockPay.save).toHaveBeenCalledTimes(2);
  });

  test('200 success confirm without charge id — covers line 188 false branch', async () => {
    const mockPay = {
      status:                'pending',
      save:                  jest.fn().mockResolvedValue(true),
      userId:                'user_student_1',
      stripePaymentIntentId: 'pi_1',
      courseId:              'c1',
      userEmail:             'test@test.com',
      userName:              'Test',
      courseTitle:           'Course',
      amount:                5000,
      currency:              'usd',
      _id:                   'pay_1',
    };
    Payment.findOne.mockResolvedValueOnce(mockPay);
    getStripe().paymentIntents.retrieve.mockResolvedValueOnce({
      status: 'succeeded',
    });
    axios.post.mockResolvedValueOnce({ data: { enrollment: { _id: 'enroll_1' } } });
    axios.post.mockResolvedValueOnce({});
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentIntentId: 'pi_1' });
    expect(res.statusCode).toBe(200);
  });

  test('200 success when enrollment creation fails', async () => {
    const mockPay = {
      status:                'pending',
      save:                  jest.fn().mockResolvedValue(true),
      userId:                'user_student_1',
      stripePaymentIntentId: 'pi_1',
      courseId:              'c1',
      userEmail:             'test@test.com',
      userName:              'Test',
      courseTitle:           'Course',
      amount:                5000,
      currency:              'usd',
      _id:                   'pay_1',
    };
    Payment.findOne.mockResolvedValueOnce(mockPay);
    getStripe().paymentIntents.retrieve.mockResolvedValueOnce({
      status:        'succeeded',
      latest_charge: 'ch_1',
    });
    axios.post.mockRejectedValueOnce(new Error('Enrollment service error'));
    axios.post.mockResolvedValueOnce({});
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentIntentId: 'pi_1' });
    expect(res.statusCode).toBe(200);
  });

  test('200 when enrollment response has no _id — covers line 201 null fallback', async () => {
    const mockPay = {
      status:                'pending',
      save:                  jest.fn().mockResolvedValue(true),
      userId:                'user_student_1',
      stripePaymentIntentId: 'pi_1',
      courseId:              'c1',
      userEmail:             'test@test.com',
      userName:              'Test',
      courseTitle:           'Course',
      amount:                5000,
      currency:              'usd',
      _id:                   'pay_1',
    };
    Payment.findOne.mockResolvedValueOnce(mockPay);
    getStripe().paymentIntents.retrieve.mockResolvedValueOnce({
      status:        'succeeded',
      latest_charge: 'ch_1',
    });
    axios.post.mockResolvedValueOnce({ data: {} });
    axios.post.mockResolvedValueOnce({});
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentIntentId: 'pi_1' });
    expect(res.statusCode).toBe(200);
    expect(res.body.enrollmentId).toBeNull();
  });

  test('200 and console.warn fires when notification throws', async () => {
    const mockPay = {
      status:                'pending',
      save:                  jest.fn().mockResolvedValue(true),
      userId:                'user_student_1',
      stripePaymentIntentId: 'pi_notify_fail',
      courseId:              'c1',
      userEmail:             'test@test.com',
      userName:              'Test',
      courseTitle:           'Course',
      amount:                5000,
      currency:              'usd',
      _id:                   'pay_notify',
    };
    Payment.findOne.mockResolvedValueOnce(mockPay);
    getStripe().paymentIntents.retrieve.mockResolvedValueOnce({
      status:        'succeeded',
      latest_charge: 'ch_1',
    });
    axios.post.mockResolvedValueOnce({
      data: { enrollment: { _id: 'enroll_ok' } },
    });
    axios.post.mockRejectedValueOnce(new Error('Notification service down'));

    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentIntentId: 'pi_notify_fail' });

    expect(res.statusCode).toBe(200);
    expect(res.body.enrollmentId).toBe('enroll_ok');

    await flushPromises();

    expect(console.warn).toHaveBeenCalledWith(
      '[confirmPayment] notification failed:',
      'Notification service down',
    );
  });

  test('500 on database error during confirm — covers lines 226-227', async () => {
    Payment.findOne.mockRejectedValueOnce(new Error('DB connection lost'));
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentIntentId: 'pi_1' });
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toContain('confirmation failed');
  });
});

describe('GET /api/payments/my', () => {

  test('401 if no token', async () => {
    const res = await request(app).get('/api/payments/my');
    expect(res.statusCode).toBe(401);
  });

  test('200 returns user payments', async () => {
    Payment.find.mockReturnValueOnce(mockFindChain([
      { _id: 'pay_1', userId: 'user_student_1', status: 'succeeded' },
      { _id: 'pay_2', userId: 'user_student_1', status: 'pending' },
    ]));
    const res = await request(app)
      .get('/api/payments/my')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('200 returns empty array when no payments', async () => {
    Payment.find.mockReturnValueOnce(mockFindChain([]));
    const res = await request(app)
      .get('/api/payments/my')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('500 on database error', async () => {
    Payment.find.mockReturnValueOnce({
      sort: jest.fn().mockRejectedValue(new Error('DB Error')),
    });
    const res = await request(app)
      .get('/api/payments/my')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(500);
  });
});

describe('GET /api/payments/:id', () => {

  test('401 if no token', async () => {
    const res = await request(app).get('/api/payments/pay_1');
    expect(res.statusCode).toBe(401);
  });

  test('404 if payment not found', async () => {
    Payment.findById.mockResolvedValueOnce(null);
    const res = await request(app)
      .get('/api/payments/pay_1')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Payment not found');
  });

  test('403 if user not payment owner', async () => {
    Payment.findById.mockResolvedValueOnce({
      _id: 'pay_1', userId: 'user_other_1', status: 'succeeded',
    });
    const res = await request(app)
      .get('/api/payments/pay_1')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('200 returns user payment', async () => {
    Payment.findById.mockResolvedValueOnce({
      _id: 'pay_1', userId: 'user_student_1', status: 'succeeded', amount: 5000,
    });
    const res = await request(app)
      .get('/api/payments/pay_1')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.userId).toBe('user_student_1');
  });

  test('500 on database error — covers line 215', async () => {
    Payment.findById.mockRejectedValueOnce(new Error('DB connection lost'));
    const res = await request(app)
      .get('/api/payments/pay_1')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(500);
  });
});


describe('src/app.js coverage', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('warns when swagger.yaml is missing — covers line 53', () => {
    const fs = require('node:fs');
    const originalRead = fs.readFileSync;
    
    // Safely spy on fs without causing an infinite recursive loop
    jest.spyOn(fs, 'readFileSync').mockImplementation((filePath, options) => {
      if (String(filePath).includes('swagger.yaml')) {
        throw new Error('ENOENT: no such file');
      }
      return originalRead(filePath, options);
    });

    require('../src/app');

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('swagger.yaml not found'));
    fs.readFileSync.mockRestore();
  });

  test('uses ALLOWED_ORIGINS env variable when set — covers line 17', async () => {
    process.env.ALLOWED_ORIGINS = 'http://myapp.com,http://localhost:3000';
    const freshApp = require('../src/app');
    
    const res = await request(freshApp).get('/health').set('Origin', 'http://myapp.com');
    expect(res.statusCode).toBe(200);
    
    delete process.env.ALLOWED_ORIGINS;
  });

  test('blocks request from disallowed CORS origin — covers line 31', async () => {
    const freshApp = require('../src/app');
    const res = await request(freshApp)
      .get('/health')
      .set('Origin', 'http://malicious-site.com');
    expect([403, 500]).toContain(res.statusCode);
  });

  test('allows request with no origin — covers line 26', async () => {
    const freshApp = require('../src/app');
    const res = await request(freshApp).get('/health');
    expect(res.statusCode).toBe(200);
  });

  test('allows request from whitelisted origin — covers lines 28-29', async () => {
    const freshApp = require('../src/app');
    const res = await request(freshApp)
      .get('/health')
      .set('Origin', 'http://localhost:3000');
    expect(res.statusCode).toBe(200);
  });
});

describe('src/index.js bootstrap', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('connects to MongoDB and starts server', async () => {
    const listenMock = jest.fn().mockImplementation((port, cb) => {
      if (cb) cb();
      return { close: jest.fn() };
    });
    
    jest.doMock('../src/app', () => ({
      listen: listenMock,
      use: jest.fn(),
      get: jest.fn(),
    }));
    
    const mongooseMock = require('mongoose');
    jest.spyOn(mongooseMock, 'connect').mockResolvedValueOnce({});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    require('../src/index');
    await flushPromises();

    expect(mongooseMock.connect).toHaveBeenCalled();
    expect(listenMock).toHaveBeenCalled();
  });

  test('calls process.exit(1) on MongoDB connection error', async () => {
    jest.doMock('../src/app', () => ({
      listen: jest.fn(),
      use: jest.fn(),
      get: jest.fn(),
    }));
    
    const mongooseMock = require('mongoose');
    jest.spyOn(mongooseMock, 'connect').mockRejectedValueOnce(new Error('Connection failed'));
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    require('../src/index');
    await flushPromises();

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});