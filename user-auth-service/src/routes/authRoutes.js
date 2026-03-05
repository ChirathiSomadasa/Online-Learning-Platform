const router = require('express').Router();
const { register, login, validate, getProfile } = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login',    login);
router.get('/validate',  validate);    
router.get('/profile',   auth, getProfile);

module.exports = router;
