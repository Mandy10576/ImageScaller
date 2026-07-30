const express = require('express');
const jobRoutes = require('./job.routes');
const healthRoutes = require('./health.routes');
const removebgRoutes = require('./removebg.routes');

const router = express.Router();

router.use('/jobs', jobRoutes);
router.use('/health', healthRoutes);
router.use('/removebg', removebgRoutes);

module.exports = router;
