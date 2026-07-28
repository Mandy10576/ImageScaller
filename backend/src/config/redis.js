const Redis = require('ioredis');
const config = require('./env');

const redisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  connectTimeout: 5000,
  retryStrategy(times) {
    // Stop endless background connection attempts if Redis is unreachable
    if (times > 3) {
      return null;
    }
    return Math.min(times * 500, 2000);
  },
};

const createRedisConnection = () => {
  const client = new Redis(redisOptions);

  client.on('connect', () => {
    console.log(`[Redis] Connected successfully to ${config.redis.host}:${config.redis.port}`);
  });

  client.on('error', (err) => {
    console.error('[Redis] Connection Error:', err.message);
  });

  return client;
};

module.exports = {
  redisOptions,
  createRedisConnection,
};
