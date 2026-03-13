const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String },
  userEmail: { type: String },
  courseId: { type: String, required: true },
  courseTitle: { type: String },
  instructor: { type: String },
  status: {
    type: String, enum: ['active', 'cancelled', 'completed'], default:
      'active'
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  enrolledAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);