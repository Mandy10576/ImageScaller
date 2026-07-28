const express = require('express');
const HealthController = require('../controllers/health.controller');

const router = express.Router();

router.get('/', HealthController.getHealthStatus);

module.exports = router;
