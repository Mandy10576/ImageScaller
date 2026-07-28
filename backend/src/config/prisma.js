const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// Prevent multiple instances of Prisma Client in development (due to hot reloading)
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
  ],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Log slow queries (> 200ms) in development for performance auditing
prisma.$on('query', (e) => {
  if (e.duration > 200) {
    logger.warn(`Slow Database Query Detected: ${e.query} - Duration: ${e.duration}ms`);
  }
});

module.exports = prisma;
