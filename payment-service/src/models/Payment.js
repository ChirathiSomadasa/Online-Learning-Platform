const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId:            { type: String, required: true, index: true },
  userEmail:         { type: String, required: true },
  userName:          { type: String },
  courseId:          { type: String, required: true },
  courseTitle:       { type: String },
  enrollmentId:      { type: String, default: null }, // set after enrollment created

  // Stripe references
  stripePaymentIntentId: { type: String, unique: true, sparse: true },
  stripeCustomerId:      { type: String, default: null },
  stripeChargeId:        { type: String, default: null },

  // Financials (amounts stored in smallest currency unit, e.g. cents)
  amount:   { type: Number, required: true },  // e.g. 4999 = $49.99
  currency: { type: String, default: 'usd' },

  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true,
  },

  // Stripe failure details
  failureCode:    { type: String, default: null },
  failureMessage: { type: String, default: null },

  // Refund details (if applicable)
  refundId:     { type: String, default: null },
  refundedAt:   { type: Date, default: null },
  refundAmount: { type: Number, default: null },

  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

paymentSchema.pre('save', async function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Payment', paymentSchema);
