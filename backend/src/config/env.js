const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const os = require('os');

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

const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const tmpDir = os.tmpdir();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  db: {
    url: process.env.DATABASE_URL || 'postgresql://upscaler_user:upscaler_password@localhost:5432/upscaler_db?schema=public',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  storage: {
    uploadDir: isVercel
      ? path.join(tmpDir, 'uploads')
      : path.resolve(process.env.UPLOAD_DIR || './uploads'),
    outputDir: isVercel
      ? path.join(tmpDir, 'outputs')
      : path.resolve(process.env.OUTPUT_DIR || './outputs'),
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  },
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
  },
};

module.exports = config;
