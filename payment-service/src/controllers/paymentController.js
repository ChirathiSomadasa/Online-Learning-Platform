const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios   = require('axios');
const Payment = require('../models/Payment');
const jwt     = require('jsonwebtoken');

const COURSE_URL = process.env.COURSE_SERVICE_URL       || 'http://localhost:3002';
const ENROLL_URL = process.env.ENROLLMENT_SERVICE_URL   || 'http://localhost:3003';
const NOTIFY_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

const serviceToken = () =>
  jwt.sign(
    { id: 'payment-service', role: 'service', name: 'Payment Service' },
    process.env.JWT_SECRET,
    { expiresIn: '1m' }
  );

// Input sanitizers 
// Prevents NoSQL injection by ensuring values are always plain strings
const sanitizeString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

// Helper: get or create Stripe customer 
async function getOrCreateStripeCustomer(userId, userEmail, userName) {
  // FIX (NoSQL injection): sanitize userId before using in DB query
  const safeUserId = sanitizeString(userId);

  const existing = await Payment.findOne({
    userId:           safeUserId,
    stripeCustomerId: { $ne: null },
  }).sort({ createdAt: -1 }).select('stripeCustomerId').lean();

  if (existing?.stripeCustomerId) return existing.stripeCustomerId;

  const customer = await stripe.customers.create({
    email:    sanitizeString(userEmail),
    name:     sanitizeString(userName),
    metadata: { userId: safeUserId },
  });
  return customer.id;
}

// POST /api/payments/create-intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { id: userId, email: userEmail, name: userName } = req.user;

    if (!courseId)
      return res.status(400).json({ message: 'courseId is required' });

    // FIX 1 (SSRF): sanitize and encode courseId before using in URL path
    const safeCourseIdRaw = sanitizeString(courseId);
    const safeCourseIdUrl = encodeURIComponent(safeCourseIdRaw);

    // FIX 2 (NoSQL injection): sanitize userId before all DB queries
    const safeUserId = sanitizeString(userId);

    // 1. Fetch course — encoded courseId prevents path traversal / SSRF
    let course;
    try {
      const resp = await axios.get(`${COURSE_URL}/api/courses/${safeCourseIdUrl}`);
      course = resp.data;
    } catch {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.price || course.price <= 0)
      return res.status(400).json({ message: 'This course does not require payment' });

    // 2. Guard: already succeeded payment?
    const existingSuccess = await Payment.findOne({
      userId:   safeUserId,
      courseId: safeCourseIdRaw,
      status:   'succeeded',
    });
    if (existingSuccess)
      return res.status(400).json({ message: 'Payment already completed for this course' });

    // 3. Guard: already enrolled?
    const token = req.headers.authorization;
    try {
      const resp = await axios.get(
        `${ENROLL_URL}/api/enrollment/user/${encodeURIComponent(safeUserId)}`,
        { headers: { Authorization: token } },
      );
      const alreadyEnrolled = (resp.data || []).some(
        (e) => sanitizeString(e.courseId) === safeCourseIdRaw && e.status === 'active',
      );
      if (alreadyEnrolled)
        return res.status(400).json({ message: 'Already enrolled in this course' });
    } catch {
      // enrollment service down — proceed
    }

    // 4. Amount in cents
    const amountInCents = Math.round(course.price * 100);

    // 5. Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(
      safeUserId,
      sanitizeString(userEmail),
      sanitizeString(userName),
    );

    // 6. Create PaymentIntent
    const intent = await stripe.paymentIntents.create({
      amount:      amountInCents,
      currency:    'usd',
      customer:    stripeCustomerId,
      metadata:    {
        userId:      safeUserId,
        userEmail:   sanitizeString(userEmail),
        courseId:    safeCourseIdRaw,
        courseTitle: sanitizeString(course.title),
      },
      description: `Enrollment: ${sanitizeString(course.title)}`,
    });

    // 7. Save pending payment record
    const payment = await Payment.create({
      userId:                safeUserId,
      userEmail:             sanitizeString(userEmail),
      userName:              sanitizeString(userName),
      courseId:              safeCourseIdRaw,
      courseTitle:           sanitizeString(course.title),
      stripePaymentIntentId: intent.id,
      stripeCustomerId,
      amount:                amountInCents,
      currency:              intent.currency,
      status:                'pending',
    });

    res.status(201).json({
      clientSecret: intent.client_secret,
      paymentId:    payment._id,
      amount:       amountInCents,
      currency:     intent.currency,
    });
  } catch (err) {
    console.error('[createPaymentIntent]', err.message);
    res.status(500).json({ message: 'Payment initialization failed', error: err.message });
  }
};

// POST /api/payments/confirm 
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const { id: userId } = req.user;

    if (!paymentIntentId)
      return res.status(400).json({ message: 'paymentIntentId is required' });

    // FIX 3 (NoSQL injection): sanitize both fields before DB query
    const safeUserId          = sanitizeString(userId);
    const safePaymentIntentId = sanitizeString(paymentIntentId);

    // 1. Find payment record
    const payment = await Payment.findOne({
      stripePaymentIntentId: safePaymentIntentId,
      userId:                safeUserId,
    });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    // Already confirmed?
    if (payment.status === 'succeeded') {
      return res.json({
        message:      'Payment already confirmed',
        payment,
        enrollmentId: payment.enrollmentId,
      });
    }

    // 2. Verify with Stripe
    const intent = await stripe.paymentIntents.retrieve(safePaymentIntentId);

    if (intent.status !== 'succeeded') {
      payment.status         = 'failed';
      payment.failureCode    = intent.last_payment_error?.code    || 'unknown';
      payment.failureMessage = intent.last_payment_error?.message || 'Payment not succeeded';
      await payment.save();
      return res.status(400).json({ message: 'Payment not succeeded', status: intent.status });
    }

    // 3. Mark succeeded
    if (intent.latest_charge) payment.stripeChargeId = intent.latest_charge;
    payment.status = 'succeeded';
    await payment.save();

    // 4. Create enrollment
    let enrollmentId = null;
    const token = req.headers.authorization;
    try {
      const resp = await axios.post(
        `${ENROLL_URL}/api/enrollment`,
        { courseId: payment.courseId },
        { headers: { Authorization: token } },
      );
      enrollmentId = resp.data?.enrollment?._id || null;
      payment.enrollmentId = enrollmentId;
      await payment.save();
    } catch (e) {
      console.warn('[confirmPayment] enrollment creation failed:', e.message);
    }

    // 5. Notify (fire-and-forget)
    axios.post(`${NOTIFY_URL}/api/notifications/send`, {
      to:          payment.userEmail,
      type:        'payment_confirmation',
      userName:    payment.userName,
      courseTitle: payment.courseTitle,
      message:     `Payment of ${(payment.amount / 100).toFixed(2)} ${payment.currency.toUpperCase()} confirmed. Payment ID: ${payment._id}.`,
    }, {
      headers: { Authorization: `Bearer ${serviceToken()}` },
    }).catch((e) => console.warn('[confirmPayment] notification failed:', e.message));

    res.json({
      message:      'Payment confirmed and enrollment created',
      payment,
      enrollmentId,
    });
  } catch (err) {
    console.error('[confirmPayment]', err.message);
    res.status(500).json({ message: 'Payment confirmation failed', error: err.message });
  }
};

// GET /api/payments/my
exports.getMyPayments = async (req, res) => {
  try {
    // FIX (NoSQL injection): sanitize userId before DB query
    const safeUserId = sanitizeString(req.user.id);
    const payments   = await Payment.find({ userId: safeUserId }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payments/:id 
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // FIX (NoSQL injection): sanitize before string comparison
    const safeUserId = sanitizeString(req.user.id);
    if (safeUserId !== sanitizeString(payment.userId))
      return res.status(403).json({ message: 'Forbidden' });

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};