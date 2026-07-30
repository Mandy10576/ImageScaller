const Redis = require('ioredis');

function getRedisOptions() {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

  const options = {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    connectTimeout: 10000,
  };

  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      options.host = parsed.hostname;
      options.port = parseInt(parsed.port || '6379', 10);
      if (parsed.password) options.password = parsed.password;
      if (parsed.username && parsed.username !== 'default') options.username = parsed.username;
      if (redisUrl.startsWith('rediss://') || parsed.hostname.includes('upstash.io')) {
        options.tls = { rejectUnauthorized: false };
      }
    } catch (e) {
      console.warn('[Redis Config] Failed to parse REDIS_URL string, falling back to env vars');
    }
  }

  if (!options.host) {
    options.host = process.env.REDIS_HOST || 'localhost';
    options.port = parseInt(process.env.REDIS_PORT || '6379', 10);
    options.password = process.env.REDIS_PASSWORD || undefined;

    if (
      options.host.includes('upstash.io') ||
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.REDIS_TLS === 'true'
    ) {
      options.tls = { rejectUnauthorized: false };
    }
  }

  return options;
}

const redisOptions = getRedisOptions();

module.exports = {
  redisOptions,
};
