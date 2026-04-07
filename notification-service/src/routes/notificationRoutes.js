const router = require('express').Router()
const { sendNotification, getLogs, getUserLogs } = require('../controllers/notificationController')
const auth = require('../middleware/authMiddleware')


// router.post('/send', sendNotification) // Called by S1, S2, S3
// router.get('/logs', getLogs)
// router.get('/logs/:email', getUserLogs)

router.post('/send', sendNotification);
router.get('/logs', auth, getLogs);
router.get('/logs/:email', auth, getUserLogs);

module.exports = router
