const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const {
  createPaymentIntent,
  confirmPayment,
  getMyPayments,
  getPaymentById,

} = require('../controllers/paymentController');

router.post('/create-intent', auth, createPaymentIntent); // Step 1
router.post('/confirm',       auth, confirmPayment);       // Step 2 — no webhook needed
router.get('/my',             auth, getMyPayments);        // logged-in user's history
router.get('/:id',            auth, getPaymentById);       // single payment

module.exports = router;

