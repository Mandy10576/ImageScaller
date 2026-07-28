const prisma = require('../config/prisma');
const { createRedisConnection } = require('../config/redis');
const catchAsync = require('../utils/catchAsync');

class HealthController {
  static getHealthStatus = catchAsync(async (req, res) => {
    let dbStatus = 'healthy';
    let redisStatus = 'healthy';

    // 1. Check PostgreSQL Database Connection (Supabase)
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      dbStatus = `unhealthy: ${err.message}`;
    }

    // 2. Check Redis Connection (BullMQ Queue)
    try {
      const redis = createRedisConnection();
      await redis.ping();
      redis.disconnect();
    } catch (err) {
      redisStatus = `unhealthy: ${err.message}`;
    }

    const isDbHealthy = dbStatus === 'healthy';
    const isRedisHealthy = redisStatus === 'healthy';

    let status = 'DOWN';
    if (isDbHealthy && isRedisHealthy) {
      status = 'UP';
    } else if (isDbHealthy) {
      status = 'DEGRADED';
    }

    // 200 OK as long as primary Database is connected
    const responseCode = isDbHealthy ? 200 : 503;

    res.status(responseCode).json({
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    });
  });
}

module.exports = HealthController;
