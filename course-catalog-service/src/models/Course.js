const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  description:   { type: String, required: true },
  instructor:    { type: String, required: true },
  instructorId:  { type: String },
  category:      { type: String, required: true },
  duration:      { type: String },
  totalSeats:    { type: Number, default: 50 },
  enrolledCount: { type: Number, default: 0 },
  status:        { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
