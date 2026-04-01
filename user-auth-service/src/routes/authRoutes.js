const router = require('express').Router();
const { register, login, validate, getProfile,updateProfile, updatePassword, deleteProfile,
    getSecurityQuestion, resetPasswordWithQuestion } = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

router.post('/register',register);
router.post('/login',login);
router.get('/validate',validate);    
router.get('/profile',auth, getProfile);
router.put('/profile',auth, updateProfile);
router.put('/profile/password', auth, updatePassword);
router.delete('/profile',auth, deleteProfile);
router.post('/forgot-password/question', getSecurityQuestion);
router.post('/forgot-password/reset',    resetPasswordWithQuestion);

module.exports = router;
