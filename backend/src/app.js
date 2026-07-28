const express = require('express');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/env');
const logger = require('./utils/logger');
const ApiError = require('./utils/ApiError');
const routes = require('./routes');
const swaggerDocument = require('./config/swagger.json');
const { securityHeaders, corsMiddleware, apiLimiter } = require('./middlewares/security.middleware');
const { errorConverter, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// 1. Security Headers & CORS
app.use(securityHeaders);
app.use(corsMiddleware);

// 2. HTTP Request Logger (Morgan)
if (config.env !== 'test') {
  app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

// 3. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Rate Limiter for API Endpoints
app.use('/api', apiLimiter);

// 5. Static Directory Serving (For output images preview)
app.use('/uploads', express.static(path.resolve(config.storage.uploadDir)));
app.use('/outputs', express.static(path.resolve(config.storage.outputDir)));

// 6. Swagger API Documentation Endpoint
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 7. API Routes
app.use('/api/v1', routes);

// 8. Handle 404 Route Not Found
app.use((req, res, next) => {
  next(ApiError.notFound(`API endpoint ${req.originalUrl} not found`));
});

// 9. Error Converter & Global Error Handler
app.use(errorConverter);
app.use(errorHandler);

// Start Server (Only if executed directly, not when imported as serverless function)
if (require.main === module) {
  const server = app.listen(config.port, () => {
    logger.info('=====================================================');
    logger.info(`   AI Image Upscaler REST API Server Running         `);
    logger.info(`   Env: ${config.env} | Port: ${config.port}           `);
    logger.info(`   Swagger Docs: http://localhost:${config.port}/docs   `);
    logger.info('=====================================================');
  });

  // Graceful Shutdown
  const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down HTTP server...`);
    server.close(() => {
      logger.info('HTTP server closed cleanly. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;
