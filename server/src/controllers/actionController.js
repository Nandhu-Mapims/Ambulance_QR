const CorrectiveAction = require('../models/CorrectiveAction');
const TripAudit = require('../models/TripAudit');
const logger = require('../utils/logger');

const listOpenActions = async (req, res) => {
  const actions = await CorrectiveAction.find({ 'issues.status': 'OPEN' })
    .populate({
      path: 'tripAuditId',
      select: 'ambulanceNumberPlate ambulanceType submittedAt complianceScore emtUserId',
      populate: { path: 'emtUserId', select: 'name email' },
    })
    .sort('-createdAt');

  res.json({ success: true, count: actions.length, actions });
};

const closeAction = async (req, res, next) => {
  const { auditId } = req.params;
  const { issues: resolutions } = req.body;

  const action = await CorrectiveAction.findOne({ tripAuditId: auditId });
  if (!action) {
    const err = new Error('Corrective action not found for this audit');
    err.statusCode = 404;
    return next(err);
  }

  const resolutionMap = Object.fromEntries(resolutions.map((r) => [r.key, r]));

  action.issues = action.issues.map((issue) => {
    const resolution = resolutionMap[issue.key];
    if (resolution) {
      return {
        ...issue.toObject(),
        actionText: resolution.actionText,
        evidenceUrl: resolution.evidenceUrl || null,
        status: 'CLOSED',
      };
    }
    return issue;
  });

  const allClosed = action.issues.every((i) => i.status === 'CLOSED');
  if (allClosed) {
    action.closedBy = req.user._id;
    action.closedAt = new Date();
    await TripAudit.findByIdAndUpdate(auditId, { status: 'CLOSED' });
  }

  await action.save();

  logger.info(
    { auditId, closedBy: req.user._id, allClosed },
    'Corrective action updated'
  );

  res.json({ success: true, action, fullyResolved: allClosed });
};

const getActionByAudit = async (req, res, next) => {
  const action = await CorrectiveAction.findOne({
    tripAuditId: req.params.auditId,
  }).populate('closedBy', 'name');

  if (!action) {
    const err = new Error('Corrective action not found');
    err.statusCode = 404;
    return next(err);
  }
  res.json({ success: true, action });
};

module.exports = { listOpenActions, closeAction, getActionByAudit };
