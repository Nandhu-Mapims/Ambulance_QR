const { Router } = require('express');
const { submitAudit, listAudits, getAudit } = require('../controllers/auditController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { createAuditSchema } = require('../schemas/auditSchemas');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.use(protect);

router.post('/', authorize('EMT'), validate(createAuditSchema), asyncHandler(submitAudit));
router.get('/', authorize('EMT', 'SUPERVISOR', 'ADMIN', 'ASSESSOR_VIEW'), asyncHandler(listAudits));
router.get('/:id', authorize('EMT', 'SUPERVISOR', 'ADMIN', 'ASSESSOR_VIEW'), asyncHandler(getAudit));

module.exports = router;
