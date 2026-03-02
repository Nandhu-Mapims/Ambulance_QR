const ChecklistTemplate = require('../models/ChecklistTemplate');
const logger = require('../utils/logger');

const listTemplates = async (req, res) => {
  const filter = {};
  if (req.query.ambulanceType) filter.ambulanceType = req.query.ambulanceType;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const templates = await ChecklistTemplate.find(filter)
    .populate('createdBy', 'name email')
    .sort('-createdAt');
  res.json({ success: true, count: templates.length, templates });
};

const getTemplate = async (req, res, next) => {
  const template = await ChecklistTemplate.findById(req.params.id).populate(
    'createdBy',
    'name email'
  );
  if (!template) {
    const err = new Error('Template not found');
    err.statusCode = 404;
    return next(err);
  }
  res.json({ success: true, template });
};

const getActiveTemplate = async (req, res, next) => {
  const template = await ChecklistTemplate.findOne({
    ambulanceType: req.params.ambulanceType,
    isActive: true,
  });
  if (!template) {
    const err = new Error(
      `No active template found for ambulance type ${req.params.ambulanceType}`
    );
    err.statusCode = 404;
    return next(err);
  }
  res.json({ success: true, template });
};

const createTemplate = async (req, res) => {
  const template = await ChecklistTemplate.create({
    ...req.body,
    createdBy: req.user._id,
  });
  logger.info({ templateId: template._id, type: template.ambulanceType }, 'Template created');
  res.status(201).json({ success: true, template });
};

const updateTemplate = async (req, res, next) => {
  const template = await ChecklistTemplate.findById(req.params.id);
  if (!template) {
    const err = new Error('Template not found');
    err.statusCode = 404;
    return next(err);
  }
  if (template.isActive) {
    const err = new Error('Cannot edit an active template — deactivate it first');
    err.statusCode = 409;
    return next(err);
  }

  Object.assign(template, req.body);
  await template.save();
  res.json({ success: true, template });
};

const activateTemplate = async (req, res, next) => {
  const template = await ChecklistTemplate.findById(req.params.id);
  if (!template) {
    const err = new Error('Template not found');
    err.statusCode = 404;
    return next(err);
  }

  // Deactivate any currently active template for this ambulance type
  await ChecklistTemplate.updateMany(
    { ambulanceType: template.ambulanceType, isActive: true },
    { isActive: false }
  );

  template.isActive = true;
  await template.save();

  logger.info(
    { templateId: template._id, type: template.ambulanceType },
    'Template activated'
  );
  res.json({ success: true, template });
};

module.exports = {
  listTemplates,
  getTemplate,
  getActiveTemplate,
  createTemplate,
  updateTemplate,
  activateTemplate,
};
