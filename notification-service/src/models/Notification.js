const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  to: { type: String },
  type: { type: String, required: true },
  userName: { type: String },
  courseTitle: { type: String },
  instructor: { type: String },
  enrollmentId: { type: String },
  message: { type: String },
  status: {
    type: String,
    enum: ['sent', 'failed', 'pending'],
    default: 'pending',
  },
  sentAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Notification', notificationSchema)
