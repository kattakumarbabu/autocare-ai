const express = require('express');
const { triggerSOS, getNearbyEmergencyServices } = require('../controllers/emergency.controller');
const { protect }    = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(apiLimiter);

router.post('/sos', triggerSOS);
router.get('/nearby', getNearbyEmergencyServices);

module.exports = router;
