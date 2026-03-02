const { Router } = require('express');
const {
  listAmbulances,
  getAmbulance,
  createAmbulance,
  updateAmbulance,
  rotateQr,
} = require('../controllers/ambulanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { ambulanceSchema, updateAmbulanceSchema } = require('../schemas/ambulanceSchemas');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.use(protect);

router.get('/', asyncHandler(listAmbulances));
router.get('/:id', asyncHandler(getAmbulance));
router.post('/', authorize('ADMIN'), validate(ambulanceSchema), asyncHandler(createAmbulance));
router.put('/:id', authorize('ADMIN'), validate(updateAmbulanceSchema), asyncHandler(updateAmbulance));
router.post('/:id/rotate-qr', authorize('ADMIN'), asyncHandler(rotateQr));

module.exports = router;
