const { Worker } = require('bullmq');
const { redisOptions } = require('../config/redis');
const prisma = require('../config/prisma');
const config = require('../config/env');
const RealESRGANService = require('../services/realesrgan.service');
const logger = require('../utils/logger');

const QUEUE_NAME = 'image-upscale-queue';

/**
 * BullMQ Worker Initialization with Concurrency Limit = 3
 */
const startWorker = () => {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const jobId = job.data?.jobId || job.data?.id;
      const { inputPath, scale } = job.data || {};
      logger.info(`[Worker] Picked up job ${jobId} (BullMQ Job ${job.id})`);

      if (!jobId || !inputPath) {
        logger.warn(`[Worker] Skipping job ${job.id} - missing jobId or inputPath in job data`);
        return { jobId, skipped: true };
      }

      // 1. Update Database Status -> PROCESSING
      await prisma.imageJob.update({
        where: { id: jobId },
        data: {
          status: 'PROCESSING',
          progress: 10,
        },
      });

      // Progress reporting function
      const updateProgress = async (percentage) => {
        await job.updateProgress(percentage);
        await prisma.imageJob.update({
          where: { id: jobId },
          data: { progress: percentage },
        });
      };

      // 2. Process image with Real-ESRGAN engine
      const outputPath = await RealESRGANService.processImage({
        inputPath,
        scale,
        onProgress: updateProgress,
      });

      // 3. Update Database Status -> COMPLETED
      const updatedRecord = await prisma.imageJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          outputPath,
          completedAt: new Date(),
        },
      });

      return { jobId, outputPath, completedAt: updatedRecord.completedAt };
    },
    {
      connection: redisOptions,
      concurrency: config.worker.concurrency, // Concurrency limit = 3
      lockDuration: 600000, // 10 minutes lock duration for long-running AI inference
      stalledInterval: 600000, // Check stalled jobs every 10 minutes
      maxStalledCount: 3,
    }
  );

  // Worker Event Listeners
  worker.on('active', (job) => {
    logger.info(`Job ${job.id} is now ACTIVE`);
  });

  worker.on('completed', (job, returnvalue) => {
    logger.info(`Job ${job.id} COMPLETED successfully. Output: ${returnvalue.outputPath}`);
  });

  worker.on('failed', async (job, err) => {
    logger.error(`Job ${job?.id} FAILED with error: ${err.message}`);
    const jobId = job?.data?.jobId || job?.data?.id;
    if (jobId) {
      await prisma.imageJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
        },
      });
    }
  });

  worker.on('error', (err) => {
    logger.error(`[Worker System Error] ${err.message}`);
  });

  logger.info(`BullMQ Worker initialized with concurrency limit = ${config.worker.concurrency}`);
  return worker;
};

module.exports = {
  startWorker,
};
