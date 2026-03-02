/**
 * Wraps an async route handler / middleware so that any rejected promise
 * is forwarded to Express's next(err) instead of causing an unhandled rejection.
 *
 * @param {Function} fn  async (req, res, next) => ...
 * @returns {Function}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
