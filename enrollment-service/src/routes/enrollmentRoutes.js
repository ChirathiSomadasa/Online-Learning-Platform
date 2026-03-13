const router = require('express').Router();
const { createEnrollment, getUserEnrollments,getEnrollmentById, cancelEnrollment, updateProgress }= require('../controllers/enrollmentController');
const auth = require('../middleware/authMiddleware');

router.post('/', createEnrollment); // Calls Auth + Catalog + Notify
router.get('/user/:userId', getUserEnrollments);
router.get('/:id', getEnrollmentById);
router.delete('/:id', cancelEnrollment);
router.put('/:id/progress', updateProgress);


module.exports = router;
