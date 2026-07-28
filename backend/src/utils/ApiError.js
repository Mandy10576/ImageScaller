/**
 * Custom Operational Error Class
 * Distinguishes known operational errors (e.g. 404 Not Found, 400 Bad Request)
 * from unknown programming/runtime errors (e.g. 500 Internal Server Error).
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(msg) {
    return new ApiError(400, msg);
  }

  static unauthorized(msg = 'Unauthorized access') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Forbidden resource') {
    return new ApiError(403, msg);
  }

  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }

  static payloadTooLarge(msg = 'Payload size exceeds maximum allowed limit') {
    return new ApiError(413, msg);
  }

  static internal(msg = 'Internal server error') {
    return new ApiError(500, msg, false);
  }
}

module.exports = ApiError;
