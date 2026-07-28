const prisma = require('../config/prisma');
const { imageUpscaleQueue } = require('../queues/imageUpscale.queue');
const ApiError = require('../utils/ApiError');
const { removeFileAsync } = require('../utils/fileSystem');
const logger = require('../utils/logger');

class JobService {
  /**
   * Create a new image job record in database & queue it in BullMQ
   */
  static async createJob({ originalName, mimeType, fileSize, inputPath, scale = 4 }) {
    // 1. Create DB entry with PENDING status
    const jobRecord = await prisma.imageJob.create({
      data: {
        originalName,
        mimeType,
        fileSize,
        inputPath,
        scale: parseInt(scale, 10) || 4,
        status: 'PENDING',
        progress: 0,
      },
    });

    // 2. Add job to BullMQ queue
    try {
      const bullJob = await imageUpscaleQueue.add(
        'upscale-image',
        {
          jobId: jobRecord.id,
          inputPath: jobRecord.inputPath,
          scale: jobRecord.scale,
        },
        {
          jobId: jobRecord.id, // Match BullMQ job ID with DB UUID
        }
      );

      logger.info(`Queued job ${jobRecord.id} in BullMQ (BullMQ ID: ${bullJob.id})`);
    } catch (queueErr) {
      logger.error(`Could not queue job ${jobRecord.id} to BullMQ: ${queueErr.message}`);
    }

    return jobRecord;
  }

  /**
   * Fetch single job by ID
   */
  static async getJobById(id) {
    const job = await prisma.imageJob.findUnique({
      where: { id },
    });

    if (!job) {
      throw ApiError.notFound(`Job with ID ${id} not found`);
    }

    return job;
  }

  /**
   * List all jobs with pagination & optional status filter
   */
  static async getAllJobs({ page = 1, limit = 10, status }) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [total, jobs] = await Promise.all([
      prisma.imageJob.count({ where }),
      prisma.imageJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete a job, remove files from disk, and remove from queue
   */
  static async deleteJob(id) {
    const job = await prisma.imageJob.findUnique({ where: { id } });
    if (!job) {
      throw ApiError.notFound(`Job with ID ${id} not found`);
    }

    // Remove files from disk
    await removeFileAsync(job.inputPath);
    if (job.outputPath) {
      await removeFileAsync(job.outputPath);
    }

    // Try removing job from BullMQ queue if pending/active
    try {
      const bullJob = await imageUpscaleQueue.getJob(id);
      if (bullJob) {
        await bullJob.remove();
      }
    } catch (err) {
      logger.warn(`Could not remove job ${id} from BullMQ queue: ${err.message}`);
    }

    // Delete DB record
    await prisma.imageJob.delete({ where: { id } });
    logger.info(`Deleted job ${id} successfully`);

    return { message: 'Job deleted successfully' };
  }

  /**
   * Retry a failed job
   */
  static async retryJob(id) {
    const job = await prisma.imageJob.findUnique({ where: { id } });
    if (!job) {
      throw ApiError.notFound(`Job with ID ${id} not found`);
    }

    if (job.status !== 'FAILED') {
      throw ApiError.badRequest(`Only failed jobs can be retried. Current status is ${job.status}`);
    }

    // Update status to PENDING
    const updatedJob = await prisma.imageJob.update({
      where: { id },
      data: {
        status: 'PENDING',
        progress: 0,
        errorMessage: null,
        outputPath: null,
        completedAt: null,
      },
    });

    // Re-add to BullMQ queue
    await imageUpscaleQueue.add(
      'upscale-image',
      {
        jobId: updatedJob.id,
        inputPath: updatedJob.inputPath,
        scale: updatedJob.scale,
      },
      { jobId: updatedJob.id }
    );

    logger.info(`Retried job ${id} queued successfully`);
    return updatedJob;
  }
}

module.exports = JobService;
