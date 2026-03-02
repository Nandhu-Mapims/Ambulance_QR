const User = require('../models/User');
const { verifyAccessToken } = require('../utils/tokenUtils');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verifies the Bearer access token and attaches req.user.
 * JWT errors (expired, invalid) are normalised by errorHandler.
 */
const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    const err = new Error('Not authorized — no token provided');
    err.statusCode = 401;
    return next(err);
  }

  const token = authHeader.split(' ')[1];
  // Throws JsonWebTokenError / TokenExpiredError → caught by asyncHandler → errorHandler
  const decoded = verifyAccessToken(token);

  const user = await User.findById(decoded.id).select('-password -refreshTokenHash');
  if (!user) {
    const err = new Error('Not authorized — user no longer exists');
    err.statusCode = 401;
    return next(err);
  }
  if (!user.isActive) {
    const err = new Error('Account has been deactivated');
    err.statusCode = 403;
    return next(err);
  }

  req.user = user;
  next();
});

module.exports = { protect };
