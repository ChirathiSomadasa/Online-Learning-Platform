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
router.get('/', getAllCourses);                
router.get('/:id', getCourseById);             

// Protected routes — require valid JWT
router.post('/', requireAuth, createCourse);            
router.put('/:id', requireAuth, updateCourse);
router.put('/:id/seats', updateSeats);                  
router.delete('/:id', requireAuth, deleteCourse);

module.exports = router;
