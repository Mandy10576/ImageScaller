const { Queue } = require('bullmq');
const { redisOptions } = require('../config/redis');
const logger = require('../utils/logger');

// Name of the BullMQ queue
const QUEUE_NAME = 'image-upscale-queue';

/**
 * Initialize BullMQ Producer Queue
 */
const imageUpscaleQueue = new Queue(QUEUE_NAME, {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds initial delay before exponential retry
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed job metadata for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed job logs for 7 days
    },
  },
});

imageUpscaleQueue.on('error', (err) => {
  logger.error(`[BullMQ Queue Error] ${err.message}`);
});

module.exports = {
  imageUpscaleQueue,
  QUEUE_NAME,
};
