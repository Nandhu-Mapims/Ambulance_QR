const mongoose = require('mongoose');
const { AMBULANCE_TYPES } = require('./Ambulance');

const QUESTION_TYPES = ['YESNO', 'TEXT', 'NUMBER', 'DROPDOWN', 'DATE', 'PHOTO'];

const questionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    required: { type: Boolean, default: true },
    options: { type: [String], default: [] },          // for DROPDOWN
    requiresEvidenceIfNo: { type: Boolean, default: false }, // for YESNO
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const checklistTemplateSchema = new mongoose.Schema(
  {
    ambulanceType: { type: String, enum: AMBULANCE_TYPES, required: true },
    name: { type: String, required: true, trim: true },
    version: { type: Number, required: true, default: 1 },
    isActive: { type: Boolean, default: false },
    questions: { type: [questionSchema], validate: [(v) => v.length > 0, 'At least one question is required'] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Only ONE active template per ambulance type (enforced in controller + this index)
checklistTemplateSchema.index({ ambulanceType: 1, isActive: 1 });
checklistTemplateSchema.index({ ambulanceType: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('ChecklistTemplate', checklistTemplateSchema);
module.exports.QUESTION_TYPES = QUESTION_TYPES;
