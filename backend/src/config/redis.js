const Redis = require('ioredis');
const config = require('./env');

function getRedisOptions() {
  const host = process.env.REDIS_HOST || config.redis?.host || 'nice-racer-185411.upstash.io';
  const port = parseInt(process.env.REDIS_PORT || config.redis?.port || '6379', 10);
  const password = process.env.REDIS_PASSWORD || config.redis?.password || 'gQAAAAAAAtRDAAIgcDEyM2QyOGQ5YmFiZDg0ODU5YmMzZWE1MDZhNTNhNThkNA';

  const options = {
    host,
    port,
    password,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    connectTimeout: 10000,
  };

  if (
    host.includes('upstash.io') ||
    process.env.REDIS_URL?.includes('upstash.io') ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_TLS === 'true'
  ) {
    options.tls = { rejectUnauthorized: false };
  }

  return options;
}

const redisOptions = getRedisOptions();

const createRedisConnection = () => {
  const client = new Redis(redisOptions);

  client.on('connect', () => {
    console.log(`[Redis] Connected successfully to ${redisOptions.host}:${redisOptions.port} (TLS: ${!!redisOptions.tls})`);
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
