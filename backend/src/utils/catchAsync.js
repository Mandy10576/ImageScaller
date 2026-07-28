/**
 * Higher-order utility function wrapping async route handlers.
 * Catches unhandled promise rejections and forwards them to the global error middleware via next(err).
 *
 * @param {Function} fn - Asynchronous Express route handler function
 * @returns {Function} Express middleware handler
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

module.exports = catchAsync;
