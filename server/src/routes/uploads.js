const { Router } = require('express');
const { uploadEvidence } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.use(protect);

router.post('/evidence', upload.single('evidence'), asyncHandler(uploadEvidence));

module.exports = router;
