const express = require('express');
const JobController = require('../controllers/job.controller');
const { uploadSingleImage } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validate.middleware');
const jobValidation = require('../validations/job.validation');

const router = express.Router();

/**
 * @route   POST /api/v1/jobs/upload
 * @desc    Upload image & queue upscaling job
 * @access  Public
 */
router.post('/upload', uploadSingleImage, JobController.uploadImage);

/**
 * @route   GET /api/v1/jobs
 * @desc    Get all jobs (Paginated)
 * @access  Public
 */
router.get('/', validate(jobValidation.getJobs), JobController.getAllJobs);

/**
 * @route   GET /api/v1/jobs/:id
 * @desc    Get job status & details by ID
 * @access  Public
 */
router.get('/:id', validate(jobValidation.getJob), JobController.getJobById);

/**
 * @route   GET /api/v1/jobs/:id/download
 * @desc    Download processed upscaled image
 * @access  Public
 */
router.get('/:id/download', validate(jobValidation.downloadJob), JobController.downloadImage);

/**
 * @route   DELETE /api/v1/jobs/:id
 * @desc    Delete job record & files
 * @access  Public
 */
router.delete('/:id', validate(jobValidation.deleteJob), JobController.deleteJob);

/**
 * @route   POST /api/v1/jobs/:id/retry
 * @desc    Retry a failed job
 * @access  Public
 */
router.post('/:id/retry', validate(jobValidation.retryJob), JobController.retryJob);

module.exports = router;
