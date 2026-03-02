/**
 * Role-Based Access Control middleware.
 *
 * Usage:  router.delete('/:id', protect, authorize('admin'), handler)
 *
 * Errors are forwarded to the centralised errorHandler via next(err).
 */
const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      const err = new Error('Not authenticated');
      err.statusCode = 401;
      return next(err);
    }

    if (!roles.includes(req.user.role)) {
      const err = new Error(
        `Role '${req.user.role}' is not authorized to access this resource`
      );
      err.statusCode = 403;
      return next(err);
    }

    next();
  };

module.exports = { authorize };
