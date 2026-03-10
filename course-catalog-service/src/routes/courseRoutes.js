const router = require('express').Router();
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  updateSeats,
  deleteCourse,
} = require('../controllers/courseController');
const { requireAuth } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllCourses);                  // anyone can browse courses
router.get('/:id', getCourseById);              // Student 3 calls this

// Protected routes — require valid JWT
router.post('/', requireAuth, createCourse);            // triggers Student 4
router.put('/:id', requireAuth, updateCourse);
router.put('/:id/seats', updateSeats);                  // called internally by Student 3
router.delete('/:id', requireAuth, deleteCourse);

module.exports = router;
