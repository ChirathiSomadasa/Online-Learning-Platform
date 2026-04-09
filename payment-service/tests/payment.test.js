const request = require('supertest');
const app     = require('../src/app');

// 1. Mock Stripe 
jest.mock('stripe', () => {
  const mockStripeInstance = {
    paymentIntents: {
      create:   jest.fn(),
      retrieve: jest.fn(),
    },
    customers: {
      create: jest.fn(),
    },
  };
  return jest.fn(() => mockStripeInstance);
});

// 2. Mock axios & Payment 
jest.mock('axios');
jest.mock('../src/models/Payment');

const stripe  = require('stripe');
const axios   = require('axios');
const Payment = require('../src/models/Payment');
const jwt     = require('jsonwebtoken');

// Helper: Stripe instance 
const getStripe = () => stripe.mock.results[0]?.value ?? stripe();

// Helper: Mongoose findOne chain mock 
const mockFindOneChain = (result) => ({
  sort:   jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  lean:   jest.fn().mockResolvedValue(result),
});

// Helper: Mongoose find chain mock 
const mockFindChain = (result) => ({
  sort: jest.fn().mockResolvedValue(result),
});

// Helper: flush all pending promises & microtasks 
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 50));

// ENV 
process.env.JWT_SECRET               = 'test_jwt_secret';
process.env.COURSE_SERVICE_URL       = 'http://course-service';
process.env.ENROLLMENT_SERVICE_URL   = 'http://enroll-service';
process.env.NOTIFICATION_SERVICE_URL = 'http://notify-service';
process.env.STRIPE_SECRET_KEY        = 'sk_test';

const studentToken = jwt.sign(
  { id: 'user_student_1', email: 'student@test.com', name: 'Test Student' },
  process.env.JWT_SECRET,
);

// ─── Reset mocks ─────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});

// ═════════════════════════════════════════════════════════════════════════════
// authMiddleware — covers lines 15-16 (invalid token catch block)
// ═════════════════════════════════════════════════════════════════════════════
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

// ═════════════════════════════════════════════════════════════════════════════
// Payment model — covers line 43 (pre-save hook updatedAt)
// ═════════════════════════════════════════════════════════════════════════════
describe('Payment Model Hooks', () => {
  test('should update updatedAt field on save — covers Payment.js line 43', async () => {
    const PaymentModel = jest.requireActual('../src/models/Payment');
    const payment = new PaymentModel({
      userId:    'u1',
      userEmail: 'u@test.com',
      courseId:  'c1',
      amount:    1000,
    });

    // Manually trigger pre-save hooks
    await Promise.all(
      payment.constructor.schema.s.hooks._pres
        .get('save')
        .map((hook) => hook.fn.call(payment)),
    );

    expect(payment.updatedAt).toBeDefined();
    expect(payment.updatedAt).toBeInstanceOf(Date);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /health
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /health', () => {
  test('returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/payments/create-intent
// ═════════════════════════════════════════════════════════════════════════════
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

  test('201 success even if enrollment service check fails — covers line 66', async () => {
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

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/payments/confirm
// ═════════════════════════════════════════════════════════════════════════════
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

  test('400 if stripe payment failed', async () => {
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

  test('200 success confirm with enrollment', async () => {
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
    axios.post.mockResolvedValueOnce({});
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ paymentIntentId: 'pi_1' });
    expect(res.statusCode).toBe(200);
    expect(mockPay.save).toHaveBeenCalledTimes(2);
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

  test('200 when enrollment response has no _id — covers line 181', async () => {
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

  test('200 success and console.warn fires when notification throws — covers lines 189-190', async () => {
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
    await flushPromises();
    expect(console.warn).toHaveBeenCalledWith(
      '[confirmPayment] notification failed:',
      'Notification service down',
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/payments/my
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /api/payments/my', () => {

  test('401 if no token', async () => {
    const res = await request(app).get('/api/payments/my');
    expect(res.statusCode).toBe(401);
  });

  test('200 returns user payments', async () => {
    Payment.find.mockReturnValueOnce(mockFindChain([
      { _id: 'pay_1', userId: 'user_student_1', status: 'succeeded' },
    ]));
    const res = await request(app)
      .get('/api/payments/my')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
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

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/payments/:id
// ═════════════════════════════════════════════════════════════════════════════
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

// ═════════════════════════════════════════════════════════════════════════════
// FINAL COVERAGE FIXES (app.js lines 17, 28-31, 53 & paymentController.js 226-227)
// ═════════════════════════════════════════════════════════════════════════════
describe('Missing Coverage Gaps', () => {
  // Targets app.js lines 28-31 (CORS error logic)
  test('Should return error for disallowed CORS origin', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://malicious-site.com');
    expect(res.statusCode).toBe(500); // Express CORS middleware throws an error on mismatch
  });

  // Targets app.js line 17 (CORS allowed origin check)
  test('Should allow request from whitelisted origin', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');
    expect(res.statusCode).toBe(200);
  });

  // Targets paymentController.js lines 226-227 (getOrCreateStripeCustomer catch block)
  test('500 if getOrCreateStripeCustomer fails due to DB error', async () => {
    axios.get.mockResolvedValueOnce({ data: { price: 50, title: 'Course' } });
    Payment.findOne.mockResolvedValueOnce(null); // success payment check
    
    // Force findOne in the helper to crash
    const chain = mockFindOneChain(null);
    chain.lean = jest.fn().mockRejectedValue(new Error('Helper DB Fail'));
    Payment.findOne.mockReturnValueOnce(chain);

    const res = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: 'c1' });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Payment initialization failed');
  });
});