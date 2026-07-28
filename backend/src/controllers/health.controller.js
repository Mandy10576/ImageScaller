const prisma = require('../config/prisma');
const { createRedisConnection } = require('../config/redis');
const catchAsync = require('../utils/catchAsync');

class HealthController {
  static getHealthStatus = catchAsync(async (req, res) => {
    let dbStatus = 'healthy';
    let redisStatus = 'healthy';
    let isHealthy = true;

    // Check Database Connection
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      dbStatus = `unhealthy: ${err.message}`;
      isHealthy = false;
    }

    // Check Redis Connection
    try {
      const redis = createRedisConnection();
      await redis.ping();
      redis.disconnect();
    } catch (err) {
      redisStatus = `unhealthy: ${err.message}`;
      isHealthy = false;
    }

    const responseCode = isHealthy ? 200 : 503;

    res.status(responseCode).json({
      status: isHealthy ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    });
  });
}

module.exports = HealthController;
