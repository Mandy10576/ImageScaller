const { startWorker } = require('./processors/imageUpscale.processor');
const logger = require('./utils/logger');

logger.info('=====================================================');
logger.info('   AI Image Upscaler - BullMQ Worker Microservice    ');
logger.info('=====================================================');

// Start BullMQ Worker Process
const worker = startWorker();

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Gracefully shutting down worker...`);
  try {
    await worker.close();
    logger.info('Worker closed cleanly. Exiting process.');
    process.exit(0);
  } catch (err) {
    logger.error(`Error during worker shutdown: ${err.message}`);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
