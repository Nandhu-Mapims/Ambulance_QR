const Ambulance = require('../models/Ambulance');
const { generateQRCode } = require('../utils/qrGenerator');
const { generateSecureToken, hashToken } = require('../utils/tokenUtils');
const logger = require('../utils/logger');

/** Build the public QR URL that encodes into the QR image.
 *  Points directly to the fill page so scanning immediately opens the checklist.
 */
const buildQrUrl = (numberPlate, token) => {
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${base}/audit/${encodeURIComponent(numberPlate)}/fill?t=${token}`;
};

const buildQr = async (ambulance) => {
  const token = generateSecureToken();
  const qrUrl = buildQrUrl(ambulance.numberPlate, token);
  const qrBase64 = await generateQRCode(qrUrl);
  return { token, qrBase64 };
};

const listAmbulances = async (req, res) => {
  const filter = {};
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.type) filter.type = req.query.type;

  const ambulances = await Ambulance.find(filter).sort('-createdAt');
  res.json({ success: true, count: ambulances.length, ambulances });
};

const getAmbulance = async (req, res, next) => {
  const ambulance = await Ambulance.findById(req.params.id);
  if (!ambulance) {
    const err = new Error('Ambulance not found');
    err.statusCode = 404;
    return next(err);
  }
  res.json({ success: true, ambulance });
};

const createAmbulance = async (req, res, next) => {
  const { numberPlate, type, station } = req.body;

  const existing = await Ambulance.findOne({ numberPlate });
  if (existing) {
    const err = new Error('Number plate already exists');
    err.statusCode = 409;
    return next(err);
  }

  const ambulance = await Ambulance.create({ numberPlate, type, station });

  // Generate initial QR
  const { token, qrBase64 } = await buildQr(ambulance);
  ambulance.qrTokenHash = hashToken(token);
  ambulance.lastQrRotatedAt = new Date();
  await ambulance.save();

  logger.info({ numberPlate, type }, 'Ambulance created');
  res.status(201).json({ success: true, ambulance, qrBase64 });
};

const updateAmbulance = async (req, res, next) => {
  const ambulance = await Ambulance.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!ambulance) {
    const err = new Error('Ambulance not found');
    err.statusCode = 404;
    return next(err);
  }
  res.json({ success: true, ambulance });
};

const rotateQr = async (req, res, next) => {
  const ambulance = await Ambulance.findById(req.params.id).select('+qrTokenHash');
  if (!ambulance) {
    const err = new Error('Ambulance not found');
    err.statusCode = 404;
    return next(err);
  }

  const { token, qrBase64 } = await buildQr(ambulance);
  ambulance.qrTokenHash = hashToken(token);
  ambulance.lastQrRotatedAt = new Date();
  await ambulance.save();

  logger.info({ numberPlate: ambulance.numberPlate }, 'QR rotated');
  res.json({ success: true, qrBase64, rotatedAt: ambulance.lastQrRotatedAt });
};

/** Public: validate QR token and return ambulance + active template.
 *  If the caller is an authenticated non-EMT (ADMIN/SUPERVISOR/ASSESSOR_VIEW)
 *  the token check is skipped so admins can inspect any ambulance by number plate.
 */
const resolveQr = async (req, res, next) => {
  const { numberPlate } = req.params;
  const { t: token } = req.query;

  // Authenticated privileged users can bypass token validation
  const bypassToken =
    req.user && req.user.role !== 'EMT';

  if (!token && !bypassToken) {
    const err = new Error('QR token is missing');
    err.statusCode = 400;
    return next(err);
  }

  const ChecklistTemplate = require('../models/ChecklistTemplate');

  const ambulance = await Ambulance.findOne({
    numberPlate: numberPlate.toUpperCase(),
  }).select('+qrTokenHash');

  if (!ambulance) {
    const err = new Error('Ambulance not found');
    err.statusCode = 404;
    return next(err);
  }

  // Validate token unless bypassing
  if (!bypassToken && ambulance.qrTokenHash !== hashToken(token)) {
    const err = new Error('Invalid or expired QR code');
    err.statusCode = 401;
    return next(err);
  }

  if (!ambulance.isActive && !bypassToken) {
    const err = new Error('Ambulance is not active');
    err.statusCode = 403;
    return next(err);
  }

  const template = await ChecklistTemplate.findOne({
    ambulanceType: ambulance.type,
    isActive: true,
  });

  if (!template) {
    const err = new Error(`No active checklist template for type ${ambulance.type}`);
    err.statusCode = 404;
    return next(err);
  }

  // Strip sensitive fields before sending
  const ambulanceData = ambulance.toObject();
  delete ambulanceData.qrTokenHash;

  res.json({ success: true, ambulance: ambulanceData, template });
};

module.exports = {
  listAmbulances,
  getAmbulance,
  createAmbulance,
  updateAmbulance,
  rotateQr,
  resolveQr,
};
