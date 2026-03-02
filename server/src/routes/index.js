const { Router } = require('express');
const { resolveQr } = require('../controllers/ambulanceController');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');

const authRoutes = require('./auth');
const ambulanceRoutes = require('./ambulances');
const templateRoutes = require('./templates');
const auditRoutes = require('./audits');
const actionRoutes = require('./actions');
const uploadRoutes = require('./uploads');
const reportRoutes = require('./reports');

const router = Router();

// ── Semi-public: optionally inject user if JWT present ─────────────────────
// The resolveQr handler uses req.user when available for bypass logic.
router.get('/audit/resolve/:numberPlate', (req, res, next) => {
  // Run protect but don't fail if no token – just continue without req.user
  protect(req, res, (err) => {
    if (err && err.statusCode === 401) return next(); // no token is OK here
    next(err);
  });
}, asyncHandler(resolveQr));

// ── Protected ──────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/ambulances', ambulanceRoutes);
router.use('/templates', templateRoutes);
router.use('/audits', auditRoutes);
router.use('/actions', actionRoutes);
router.use('/uploads', uploadRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
