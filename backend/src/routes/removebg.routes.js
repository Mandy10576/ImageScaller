const express = require('express');
const multer = require('multer');
const { removeBackgroundAPI } = require('../controllers/removebg.controller');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max limit
});

/**
 * @route POST /api/v1/removebg
 * @desc Remove image background using Remove.bg API
 * @access Public / Private (with X-Api-Key)
 */
router.post('/', upload.single('file'), removeBackgroundAPI);

module.exports = router;
