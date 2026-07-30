const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from local .env or root .env
const envPaths = [
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../../.env'),
  path.join(process.cwd(), '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const config = {
  env: process.env.NODE_ENV || 'development',
  db: {
    url: process.env.DATABASE_URL || 'postgresql://upscaler_user:upscaler_password@localhost:5432/upscaler_db?schema=public',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  storage: {
    uploadDir: path.resolve(process.env.UPLOAD_DIR || '../backend/uploads'),
    outputDir: path.resolve(process.env.OUTPUT_DIR || '../backend/outputs'),
  },
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
  },
};

module.exports = config;
