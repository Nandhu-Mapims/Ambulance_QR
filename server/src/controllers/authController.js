const crypto = require('crypto');
const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../utils/tokenUtils');
const logger = require('../utils/logger');

/** Seed the first ADMIN or register subsequent users (ADMIN only). */
const register = async (req, res, next) => {
  const totalUsers = await User.countDocuments();

  // Bootstrap: allow first user creation without auth
  if (totalUsers > 0 && (!req.user || req.user.role !== 'ADMIN')) {
    const err = new Error('Only ADMIN can register new users');
    err.statusCode = 403;
    return next(err);
  }

  const { name, email, password, role, station } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email is already registered');
    err.statusCode = 409;
    return next(err);
  }

  const user = await User.create({ name, email, password, role, station });
  logger.info({ userId: user._id, role: user.role }, 'New user registered');
  res.status(201).json({ success: true, user });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+refreshTokenHash');
  if (!user || !(await user.comparePassword(password))) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    return next(err);
  }
  if (!user.isActive) {
    const err = new Error('Account has been deactivated');
    err.statusCode = 403;
    return next(err);
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  logger.info({ userId: user._id }, 'User logged in');
  res.json({ success: true, accessToken, refreshToken, user });
};

const refresh = async (req, res, next) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    return next(err);
  }

  const user = await User.findById(decoded.id).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) {
    const err = new Error('Session not found — please log in again');
    err.statusCode = 401;
    return next(err);
  }

  if (user.refreshTokenHash !== hashToken(refreshToken)) {
    // Possible token reuse attack — invalidate session
    user.refreshTokenHash = null;
    await user.save({ validateBeforeSave: false });
    const err = new Error('Refresh token reuse detected — session revoked');
    err.statusCode = 401;
    return next(err);
  }

  // Rotate: issue new pair
  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
};

const logout = async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { refreshTokenHash: null });
  }
  res.json({ success: true, message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

const listUsers = async (req, res) => {
  const users = await User.find().sort('-createdAt');
  res.json({ success: true, count: users.length, users });
};

const toggleUserStatus = async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: req.body.isActive },
    { new: true }
  );
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    return next(err);
  }
  res.json({ success: true, user });
};

/** Update user profile (name, email, role, station) and optionally set new password. ADMIN only. */
const updateUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    return next(err);
  }
  const { name, email, role, station, newPassword } = req.body;
  if (name !== undefined) user.name = name;
  if (email !== undefined) {
    const existing = await User.findOne({ email, _id: { $ne: user._id } });
    if (existing) {
      const err = new Error('Email is already registered');
      err.statusCode = 409;
      return next(err);
    }
    user.email = email;
  }
  if (role !== undefined) user.role = role;
  if (station !== undefined) user.station = station;
  if (newPassword && typeof newPassword === 'string' && newPassword.length >= 6) {
    user.password = newPassword;
  }
  await user.save();
  logger.info({ userId: user._id }, 'User updated');
  res.json({ success: true, user });
};

/** Delete user. ADMIN only. */
const deleteUser = async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    return next(err);
  }
  logger.info({ userId: user._id }, 'User deleted');
  res.json({ success: true, message: 'User deleted' });
};

module.exports = { register, login, refresh, logout, getMe, listUsers, toggleUserStatus, updateUser, deleteUser };
