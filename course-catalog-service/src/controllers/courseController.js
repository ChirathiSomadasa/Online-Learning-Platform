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

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sanitizeCourseBody = (body) => ({
  title:        body.title,
  description:  body.description,
  category:     body.category,
  instructor:   body.instructor,
  price:        body.price,
  status:       body.status,
  maxSeats:     body.maxSeats,
  totalSeats:   body.totalSeats,
  duration:     body.duration,
  instructorId: body.instructorId,
});

// GET /api/courses — public: active courses only (student catalog view)
exports.getAllCourses = async (req, res) => {
  try {
    const filter = { status: 'active' };

    const ALLOWED_CATEGORIES = ['development', 'design', 'business', 'marketing', 'other'];
    if (req.query.category) {
      if (!ALLOWED_CATEGORIES.includes(req.query.category)) {
        return res.status(400).json({ message: 'Invalid category value' });
      }
      filter.category = req.query.category;
    }

    if (req.query.search) {
      const safeSearch = escapeRegex(String(req.query.search).trim());
      filter.title = { $regex: safeSearch, $options: 'i' };
    }

    const courses = await Course.find(filter).sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/courses/my-courses — protected: ALL courses for the logged-in instructor
exports.getInstructorCourses = async (req, res) => {
  try {
    // req.user is populated by requireAuth middleware from the JWT
    const courses = await Course.find({ instructorId: req.user.id }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/courses/:id
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/courses
exports.createCourse = async (req, res) => {
  try {
    const courseData = sanitizeCourseBody(req.body);
    courseData.instructorId = req.user.id || req.user._id; 

    const course = await Course.create(courseData);

    try {
      await axios.post(
        `${NOTIFY_URL}/api/notifications/send`,
        {
          type: 'new_course',
          courseTitle: course.title,
          instructor: course.instructor,
          message: `New course available: "${course.title}" by ${course.instructor}`,
        },
        { headers: { Authorization: `Bearer ${serviceToken()}` } }
      );
    } catch (e) {
      console.warn('Notification service unavailable:', e.message);
    }

    res.status(201).json({ message: 'Course created successfully', course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    const courseData = sanitizeCourseBody(req.body);

    const course = await Course.findByIdAndUpdate(req.params.id, courseData, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course updated successfully', course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/courses/:id/seats
exports.updateSeats = async (req, res) => {
  try {
    const { action } = req.body;

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

// DELETE /api/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};