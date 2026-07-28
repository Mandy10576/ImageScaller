const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Normalizes any error into an ApiError object.
 */
const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

/**
 * Global Express Error Handling Middleware.
 * Catches all normalized errors and returns standard JSON payload.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // Ensure detailed error message is returned so client can report root cause
  if (!message || message === 'Internal Server Error') {
    message = err.message || 'An unexpected error occurred on the server';
  }

  res.locals.errorMessage = message;

  const response = {
    success: false,
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (statusCode >= 500) {
    logger.error(`[HTTP Exception] ${req.method} ${req.originalUrl} - ${statusCode}: ${err.message}`, {
      stack: err.stack,
    });
  } else {
    logger.warn(`[Client Error] ${req.method} ${req.originalUrl} - ${statusCode}: ${err.message}`);
  }

  res.status(statusCode).json(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};
