const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

/**
 * Configure Helmet security headers
 */
const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows cross-origin image downloads
});

/**
 * Configure CORS middleware
 */
const corsMiddleware = cors({
  origin: '*', // Production setup can specify exact domains
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

/**
 * Configure API Rate Limiting (Prevent Brute-Force & Denial of Service)
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 1000, // Limit each IP to 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Prevent proxy header validation error crashes
  message: {
    success: false,
    code: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

module.exports = {
  securityHeaders,
  corsMiddleware,
  apiLimiter,
};
