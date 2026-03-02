const { Router } = require('express');
const { getCqiReport, getCqiExcel, getCqiPdf } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.use(protect);
router.use(authorize('SUPERVISOR', 'ADMIN', 'ASSESSOR_VIEW'));

router.get('/cqi', asyncHandler(getCqiReport));
router.get('/cqi/excel', asyncHandler(getCqiExcel));
router.get('/cqi/pdf', asyncHandler(getCqiPdf));

module.exports = router;
