const TripAudit = require('../models/TripAudit');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const CorrectiveAction = require('../models/CorrectiveAction');
const Ambulance = require('../models/Ambulance');
const logger = require('../utils/logger');

/**
 * Calculate compliance based on YESNO questions.
 * Returns { complianceScore, nonComplianceCount, nonCompliantKeys }.
 */
const calcCompliance = (questions, responses) => {
  const yesnoKeys = questions
    .filter((q) => q.type === 'YESNO')
    .map((q) => q.key);

  if (yesnoKeys.length === 0) return { complianceScore: 100, nonComplianceCount: 0, nonCompliantKeys: [] };

  const responseMap = Object.fromEntries(responses.map((r) => [r.key, r]));
  const nonCompliantKeys = yesnoKeys.filter((k) => responseMap[k]?.value === 'NO');
  const complianceScore = Math.round(
    ((yesnoKeys.length - nonCompliantKeys.length) / yesnoKeys.length) * 100
  );

  return { complianceScore, nonComplianceCount: nonCompliantKeys.length, nonCompliantKeys };
};

const submitAudit = async (req, res, next) => {
  const { ambulanceNumberPlate, templateId, tripMeta, responses, geo } = req.body;

  // Validate ambulance exists and is active
  const ambulance = await Ambulance.findOne({
    numberPlate: ambulanceNumberPlate,
    isActive: true,
  });
  if (!ambulance) {
    const err = new Error('Ambulance not found or inactive');
    err.statusCode = 404;
    return next(err);
  }

  // Validate template
  const template = await ChecklistTemplate.findById(templateId);
  if (!template || !template.isActive) {
    const err = new Error('Template not found or not active');
    err.statusCode = 404;
    return next(err);
  }

  if (template.ambulanceType !== ambulance.type) {
    const err = new Error('Template type does not match ambulance type');
    err.statusCode = 400;
    return next(err);
  }

  const responseMap = Object.fromEntries(responses.map((r) => [r.key, r]));

  // Validate required questions
  for (const q of template.questions) {
    const resp = responseMap[q.key];

    if (q.required && (resp === undefined || resp.value === null || resp.value === '')) {
      const err = new Error(`Response required for question: "${q.label}"`);
      err.statusCode = 400;
      return next(err);
    }
  }

  const { complianceScore, nonComplianceCount, nonCompliantKeys } = calcCompliance(
    template.questions,
    responses
  );

  const status = nonComplianceCount > 0 ? 'NEED_ACTION' : 'SUBMITTED';

  const audit = await TripAudit.create({
    ambulanceNumberPlate,
    ambulanceType: ambulance.type,
    templateId,
    templateVersion: template.version,
    emtUserId: req.user._id,
    tripMeta: tripMeta || {},
    responses,
    complianceScore,
    nonComplianceCount,
    status,
    submittedAt: new Date(),
    geo: geo || null,
  });

  // Auto-create corrective action record for non-compliant responses
  if (nonComplianceCount > 0) {
    const qMap = Object.fromEntries(template.questions.map((q) => [q.key, q]));
    const issues = nonCompliantKeys.map((key) => ({
      key,
      issueText: `Non-compliant: ${qMap[key]?.label || key}`,
      status: 'OPEN',
    }));
    await CorrectiveAction.create({ tripAuditId: audit._id, issues });
  }

  logger.info(
    { auditId: audit._id, ambulanceNumberPlate, complianceScore, status },
    'Audit submitted'
  );

  res.status(201).json({ success: true, audit });
};

const listAudits = async (req, res) => {
  const filter = {};
  if (req.query.numberPlate)
    filter.ambulanceNumberPlate = { $regex: req.query.numberPlate.trim(), $options: 'i' };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.emtUserId) filter.emtUserId = req.query.emtUserId;

  // Date range filter
  if (req.query.from || req.query.to) {
    filter.submittedAt = {};
    if (req.query.from) filter.submittedAt.$gte = new Date(req.query.from);
    if (req.query.to) {
      const to = new Date(req.query.to);
      to.setHours(23, 59, 59, 999);
      filter.submittedAt.$lte = to;
    }
  }

  // EMT sees only their own audits
  if (req.user.role === 'EMT') filter.emtUserId = req.user._id;

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [audits, total] = await Promise.all([
    TripAudit.find(filter)
      .populate('emtUserId', 'name email')
      .sort('-submittedAt')
      .skip(skip)
      .limit(limit),
    TripAudit.countDocuments(filter),
  ]);

  res.json({ success: true, total, page, limit, audits });
};

const getAudit = async (req, res, next) => {
  const audit = await TripAudit.findById(req.params.id)
    .populate('emtUserId', 'name email')
    .populate('templateId', 'name version questions');

  if (!audit) {
    const err = new Error('Audit not found');
    err.statusCode = 404;
    return next(err);
  }

  // EMT can only view their own
  if (req.user.role === 'EMT' && String(audit.emtUserId._id) !== String(req.user._id)) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    return next(err);
  }

  const action = await CorrectiveAction.findOne({ tripAuditId: audit._id }).populate(
    'closedBy',
    'name'
  );

  res.json({ success: true, audit, correctiveAction: action });
};

module.exports = { submitAudit, listAudits, getAudit };
