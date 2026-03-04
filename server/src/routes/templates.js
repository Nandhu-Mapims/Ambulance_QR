const { Router } = require('express');
const {
  listTemplates,
  getTemplate,
  getActiveTemplate,
  createTemplate,
  updateTemplate,
  activateTemplate,
  deleteTemplate,
} = require('../controllers/templateController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { createTemplateSchema, updateTemplateSchema } = require('../schemas/templateSchemas');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.use(protect);

router.get('/', asyncHandler(listTemplates));
router.get('/active/:ambulanceType', asyncHandler(getActiveTemplate));
router.get('/:id', asyncHandler(getTemplate));
router.post('/', authorize('ADMIN'), validate(createTemplateSchema), asyncHandler(createTemplate));
router.put('/:id', authorize('ADMIN'), validate(updateTemplateSchema), asyncHandler(updateTemplate));
router.post('/:id/activate', authorize('ADMIN'), asyncHandler(activateTemplate));
router.delete('/:id', authorize('ADMIN'), asyncHandler(deleteTemplate));

module.exports = router;
