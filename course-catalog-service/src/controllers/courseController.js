const Course = require('../models/Course');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const NOTIFY_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';


const serviceToken = () =>
  jwt.sign(
    { id: 'course-catalog-service', role: 'service', name: 'Course Catalog' },
    process.env.JWT_SECRET,
    { expiresIn: '1m' }
  );

// GET /api/courses — list all active courses
exports.getAllCourses = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { status: 'active' };

    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const courses = await Course.find(filter).sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/courses/:id — called by Enrollment Service (Student 3)
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/courses — create a new course
// INTEGRATION OUT: calls Notification Service (Student 4)
exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);

    try {
      await axios.post(
        `${NOTIFY_URL}/api/notifications/send`,
        {
          type: 'new_course',
          courseTitle: course.title,
          instructor: course.instructor,
          message: `New course available: "${course.title}" by ${course.instructor}`,
        },
        {
          headers: { Authorization: `Bearer ${serviceToken()}` }  // ← add this
        }
      );
    } catch (e) {
      console.warn('Notification service unavailable:', e.message);
    }

    res.status(201).json({ message: 'Course created successfully', course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/courses/:id — update course details
exports.updateCourse = async (req, res) => {
  try {
    // Prevent external tampering with enrolledCount via this endpoint
    delete req.body.enrolledCount;

    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course updated successfully', course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/courses/:id/seats — called by Enrollment Service (Student 3)
exports.updateSeats = async (req, res) => {
  try {
    const { action } = req.body; // 'increment' or 'decrement'

    if (!['increment', 'decrement'].includes(action)) {
      return res.status(400).json({ message: 'action must be increment or decrement' });
    }

    const update =
      action === 'increment'
        ? { $inc: { enrolledCount: 1 } }
        : { $inc: { enrolledCount: -1 } };

    const course = await Course.findByIdAndUpdate(req.params.id, update, {
     returnDocument: 'after',
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Seat count updated', course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/courses/:id — remove course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
