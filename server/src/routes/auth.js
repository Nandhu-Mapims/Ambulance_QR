const { Router } = require('express');
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  listUsers,
  toggleUserStatus,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema, refreshSchema } = require('../schemas/authSchemas');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

// First admin seed OR admin-only registration
router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/refresh', validate(refreshSchema), asyncHandler(refresh));
router.post('/logout', protect, asyncHandler(logout));
router.get('/me', protect, asyncHandler(getMe));
router.get('/users', protect, authorize('ADMIN'), asyncHandler(listUsers));
router.patch('/users/:id/status', protect, authorize('ADMIN'), asyncHandler(toggleUserStatus));

module.exports = router;
