const fs = require('fs');
const path = require('path');
const JobService = require('../services/job.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

class JobController {
  /**
   * Upload image & create processing job
   * POST /api/v1/jobs/upload
   */
  static uploadImage = catchAsync(async (req, res) => {
    const file = req.file;
    const { scale = 4 } = req.body;

    const job = await JobService.createJob({
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      inputPath: file.path,
      scale,
    });

    res.status(202).json({
      success: true,
      message: 'Image uploaded successfully. Processing job added to queue.',
      data: job,
    });
  });

  /**
   * Get job status by ID
   * GET /api/v1/jobs/:id
   */
  static getJobById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const job = await JobService.getJobById(id);

    res.status(200).json({
      success: true,
      data: job,
    });
  });

  /**
   * Get all jobs (Paginated)
   * GET /api/v1/jobs
   */
  static getAllJobs = catchAsync(async (req, res) => {
    const { page, limit, status } = req.query;
    const result = await JobService.getAllJobs({ page, limit, status });

    res.status(200).json({
      success: true,
      data: result.jobs,
      pagination: result.pagination,
    });
  });

  /**
   * Download processed output image file
   * GET /api/v1/jobs/:id/download
   */
  static downloadImage = catchAsync(async (req, res) => {
    const { id } = req.params;
    const job = await JobService.getJobById(id);

    if (job.status !== 'COMPLETED' || !job.outputPath) {
      throw ApiError.badRequest(
        `Cannot download image. Current job status is '${job.status}'. Output file is not ready.`
      );
    }

    if (!fs.existsSync(job.outputPath)) {
      throw ApiError.notFound('Processed output image file no longer exists on disk.');
    }

    const filename = `upscaled-${job.originalName}`;
    res.download(job.outputPath, filename);
  });

  /**
   * Delete job & associated files
   * DELETE /api/v1/jobs/:id
   */
  static deleteJob = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await JobService.deleteJob(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  });

  /**
   * Retry a failed job
   * POST /api/v1/jobs/:id/retry
   */
  static retryJob = catchAsync(async (req, res) => {
    const { id } = req.params;
    const job = await JobService.retryJob(id);

    res.status(200).json({
      success: true,
      message: 'Job re-queued for processing successfully',
      data: job,
    });
  });
}

module.exports = JobController;
