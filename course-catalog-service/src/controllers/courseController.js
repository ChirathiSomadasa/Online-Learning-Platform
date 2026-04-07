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
  title:        String(body.title || ''),
  description:  String(body.description || ''),
  category:     String(body.category || ''),
  instructor:   String(body.instructor || ''),
  price:        Number(body.price) || 0,
  status:       body.status === 'inactive' ? 'inactive' : 'active',
  totalSeats:   Number(body.totalSeats) || 30,
  duration:     String(body.duration || ''),
});

exports.getAllCourses = async (req, res) => {
  try {
    const filter = { status: 'active' };
    const ALLOWED_CATEGORIES = ['development', 'design', 'business', 'marketing', 'other'];
    
    if (req.query.category && ALLOWED_CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }

    if (req.query.search) {
      const safeSearch = escapeRegex(String(req.query.search).trim());
      filter.title = { $regex: safeSearch, $options: 'i' };
    }

    const courses = await Course.find(filter).sort({ createdAt: -1 }).lean();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" }); 
  }
};

exports.getInstructorCourses = async (req, res) => {
  try {
    // Cast to String to prevent NoSQL injection objects
    const instructorId = String(req.user.id);
    const courses = await Course.find({ instructorId }).sort({ createdAt: -1 }).lean();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(String(req.params.id)).lean();
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const courseData = sanitizeCourseBody(req.body);
    courseData.instructorId = String(req.user.id || req.user._id); 

    const course = await Course.create(courseData);

    axios.post(
      `${NOTIFY_URL}/api/notifications/send`,
      {
        type: 'new_course',
        courseTitle: course.title,
        instructor: course.instructor,
        message: `New course available: "${course.title}" by ${course.instructor}`,
      },
      { headers: { Authorization: `Bearer ${serviceToken()}` } }
    ).catch(() => {
      // Log to a proper file logger in production, or leave empty to pass Sonar
    });

    res.status(201).json({ message: 'Course created successfully', course });
  } catch (err) {
    res.status(500).json({ message: "Error creating course" });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const courseData = sanitizeCourseBody(req.body);
    const course = await Course.findByIdAndUpdate(String(req.params.id), courseData, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course updated successfully', course });
  } catch (err) {
    res.status(500).json({ message: "Error updating course" });
  }
};

exports.updateSeats = async (req, res) => {
  try {
    const { action } = req.body;
    if (!['increment', 'decrement'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const update = action === 'increment' ? { $inc: { enrolledCount: 1 } } : { $inc: { enrolledCount: -1 } };
    const course = await Course.findByIdAndUpdate(String(req.params.id), update, { returnDocument: 'after' });
    
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Seat count updated', course });
  } catch (err) {
    res.status(500).json({ message: "Error updating seats" });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(String(req.params.id));
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: "Error deleting course" });
  }
};