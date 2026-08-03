const Redis = require('ioredis');
const config = require('./env');

function getRedisOptions() {
  const host = process.env.REDIS_HOST || config.redis?.host || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || config.redis?.port || '6379', 10);
  const password = process.env.REDIS_PASSWORD || config.redis?.password || undefined;

  const options = {
    host,
    port,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    connectTimeout: 10000,
  };

  if (password) {
    options.password = password;
  }

  const isLocal = host === 'localhost' || host === 'redis' || host === '127.0.0.1';
  if (!isLocal && (host.includes('upstash.io') || process.env.REDIS_TLS === 'true')) {
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
