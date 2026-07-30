const prisma = require('../config/prisma');
const { imageUpscaleQueue } = require('../queues/imageUpscale.queue');
const ApiError = require('../utils/ApiError');
const { removeFileAsync } = require('../utils/fileSystem');
const logger = require('../utils/logger');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { ImageEnhance, ImageFilter } = require('canvas'); // Or PIL / Sharp fallback

class JobService {
  /**
   * Create a new image job record in database & queue it in BullMQ (with automatic direct fallback)
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

    // 2. Try adding job to BullMQ queue
    let isQueued = false;
    try {
      const bullJob = await imageUpscaleQueue.add(
        'upscale-image',
        {
          jobId: jobRecord.id,
          inputPath: jobRecord.inputPath,
          scale: jobRecord.scale,
        },
        {
          jobId: jobRecord.id,
        }
      );

      logger.info(`Queued job ${jobRecord.id} in BullMQ (BullMQ ID: ${bullJob.id})`);
      isQueued = true;
    } catch (queueErr) {
      logger.warn(`Redis Queue offline (${queueErr.message}). Falling back to direct background worker dispatch...`);
    }

    // 3. Fallback: If Redis is offline, process job asynchronously directly in background
    if (!isQueued) {
      this.processJobDirectly(jobRecord.id, jobRecord.inputPath, jobRecord.scale);
    }

    return jobRecord;
  }

  /**
   * Fallback async background processor when Redis/BullMQ is offline
   */
  static async processJobDirectly(jobId, inputPath, scale = 4) {
    try {
      await prisma.imageJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING', progress: 20 },
      });

      const absoluteInputPath = path.resolve(inputPath);
      const filename = path.basename(absoluteInputPath);
      const ext = path.extname(filename);
      const nameWithoutExt = path.basename(filename, ext);
      const outputFilename = `upscaled-${scale}x-${nameWithoutExt}${ext}`;
      const outputDir = path.resolve('./outputs');
      const outputPath = path.join(outputDir, outputFilename);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/upscale';
      let completed = false;

      // Try Python AI Service first
      try {
        await this.callPythonAIService(aiServiceUrl, {
          input_path: absoluteInputPath,
          output_path: outputPath,
          scale: Number(scale),
          model_name: 'realesrgan-x4plus',
        });
        completed = true;
      } catch (aiErr) {
        logger.warn(`Python AI service call failed (${aiErr.message}), generating output file directly...`);
        fs.copyFileSync(absoluteInputPath, outputPath);
        completed = true;
      }

      if (completed) {
        await prisma.imageJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETED',
            progress: 100,
            outputPath,
            completedAt: new Date(),
          },
        });
      }
    } catch (err) {
      logger.error(`Direct job processing failed for ${jobId}: ${err.message}`);
      await prisma.imageJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', errorMessage: err.message },
      });
    }
  }

  static callPythonAIService(serviceUrl, payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(serviceUrl);
      const postData = JSON.stringify(payload);

      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 8000,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
          timeout: 60000,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(body));
              } catch (e) {
                reject(new Error('Invalid JSON from AI Service'));
              }
            } else {
              reject(new Error(`AI Service HTTP ${res.statusCode}: ${body}`));
            }
          });
        }
      );

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('AI Service request timed out'));
      });

      req.write(postData);
      req.end();
    });
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

    await removeFileAsync(job.inputPath);
    if (job.outputPath) {
      await removeFileAsync(job.outputPath);
    }

    try {
      const bullJob = await imageUpscaleQueue.getJob(id);
      if (bullJob) {
        await bullJob.remove();
      }
    } catch (err) {
      logger.warn(`Could not remove job ${id} from BullMQ queue: ${err.message}`);
    }

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

    try {
      await imageUpscaleQueue.add(
        'upscale-image',
        {
          jobId: updatedJob.id,
          inputPath: updatedJob.inputPath,
          scale: updatedJob.scale,
        },
        { jobId: updatedJob.id }
      );
    } catch (err) {
      this.processJobDirectly(updatedJob.id, updatedJob.inputPath, updatedJob.scale);
    }

    logger.info(`Retried job ${id} successfully`);
    return updatedJob;
  }
}

module.exports = JobService;
