const Enrollment = require('../models/Enrollment');
const axios = require('axios');

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const COURSE_URL = process.env.COURSE_SERVICE_URL || 'http://localhost:3002';
const NOTIFY_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

// POST /api/enrollments
exports.createEnrollment = async (req, res) => {
  try {
    const { courseId } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    // Validate user via Auth Service
    const authRes = await axios.get(`${AUTH_URL}/api/auth/validate`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!authRes.data.valid) return res.status(401).json({ message: 'Unauthorized' });
    const user = authRes.data.user;

    // Get course details
    const courseRes = await axios.get(`${COURSE_URL}/api/courses/${courseId}`);
    const course = courseRes.data;
    if (course.enrolledCount >= course.totalSeats)
      return res.status(400).json({ message: 'Course is full' });

    // Check if already enrolled
    const existing = await Enrollment.findOne({ userId: user.id, courseId, status: 'active' });
    if (existing) return res.status(400).json({ message: 'Already enrolled' });

    // Create enrollment
    const enrollment = await Enrollment.create({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      courseId,
      courseTitle: course.title,
      instructor: course.instructor,
    });

    // Increment course seats
    axios.put(`${COURSE_URL}/api/courses/${courseId}/seats`, { action: 'increment' })
      .catch(e => console.warn('Seat update failed:', e.message));

    // Send notification
    axios.post(`${NOTIFY_URL}/api/notifications/send`, {
      to: user.email,
      type: 'enrollment_confirmation',
      userName: user.name,
      courseTitle: course.title,
      instructor: course.instructor,
      enrollmentId: enrollment._id
    }).catch(e => console.warn('Notification failed:', e.message));

    res.status(201).json({ message: 'Enrolled successfully', enrollment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//get user enrollments
exports.getUserEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.params.userId });
    res.json(enrollments);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

//get enrollments by ID
exports.getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Not found' });
    res.json(enrollment);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

//cancel enrollments
exports.cancelEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id, { status: 'cancelled' }, { returnDocument: 'after' });
    if (!enrollment) return res.status(404).json({ message: 'Not found' });
    try {
      await axios.put(`${COURSE_URL}/api/courses/${enrollment.courseId}/seats`,
        { action: 'decrement' });
    } catch (e) { console.warn('Seat update failed:', e.message); }
    res.json({ message: 'Enrollment cancelled', enrollment });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

//update progress
exports.updateProgress = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id, { progress: req.body.progress }, { new: true });
    res.json(enrollment);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
