const ApiError = require('../utils/ApiError');

/**
 * Validates request data against a Zod schema object containing params, query, or body.
 *
 * @param {Object} schema - Zod validation schema object
 * @returns {Function} Express middleware function
 */
const validate = (schema) => (req, res, next) => {
  try {
    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }
    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    return next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const errorMessage = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return next(ApiError.badRequest(`Validation Error: ${errorMessage}`));
    }
    return next(error);
  }
};

module.exports = validate;
