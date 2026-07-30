const Redis = require('ioredis');
const prisma = require('../config/prisma');
const config = require('../config/env');
const catchAsync = require('../utils/catchAsync');

class HealthController {
  static getHealthStatus = catchAsync(async (req, res) => {
    let dbStatus = 'healthy';
    let redisStatus = 'healthy';

    // 1. Check PostgreSQL Database Connection with 3-second timeout limit
    try {
      const dbCheckPromise = prisma.$queryRaw`SELECT 1`;
      const dbTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query connection timed out (3s limit)')), 3000)
      );
      await Promise.race([dbCheckPromise, dbTimeoutPromise]);
    } catch (err) {
      dbStatus = `unhealthy: ${err.message}`;
    }

    // 2. Check Redis Connection with 1-second timeout limit so it NEVER hangs HTTP request
    try {
      const redisCheckPromise = new Promise((resolve, reject) => {
        const client = new Redis({
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password,
          connectTimeout: 1000,
          // maxRetriesPerRequest: 1,
          retryStrategy: () => null,
          // enableOfflineQueue: false,
        });

        client.on('error', (e) => {
          try { client.disconnect(); } catch (_) {}
          reject(e);
        });

        client.ping()
          .then(() => {
            try { client.disconnect(); } catch (_) {}
            resolve('healthy');
          })
          .catch((e) => {
            try { client.disconnect(); } catch (_) {}
            reject(e);
          });
      });

      const redisTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timed out (1s limit)')), 1000)
      );

      redisStatus = await Promise.race([redisCheckPromise, redisTimeoutPromise]);
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

    // Return 200 OK as long as Database is active
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
