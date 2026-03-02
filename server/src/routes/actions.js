const { Router } = require('express');
const { listOpenActions, closeAction, getActionByAudit } = require('../controllers/actionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { closeActionSchema } = require('../schemas/actionSchemas');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.use(protect);
router.use(authorize('SUPERVISOR', 'ADMIN'));

router.get('/open', asyncHandler(listOpenActions));
router.get('/audit/:auditId', asyncHandler(getActionByAudit));
router.put('/:auditId/close', validate(closeActionSchema), asyncHandler(closeAction));

module.exports = router;
