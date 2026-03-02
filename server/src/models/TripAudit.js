const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    evidenceUrl: { type: String, default: null },
  },
  { _id: false }
);

const tripMetaSchema = new mongoose.Schema(
  {
    patientId: { type: String, trim: true },
    tripType: {
      type: String,
      enum: ['EMERGENCY', 'TRANSFER', 'ROUTINE'],
      default: 'EMERGENCY',
    },
    from: { type: String, trim: true },
    to: { type: String, trim: true },
  },
  { _id: false }
);

const geoSchema = new mongoose.Schema(
  {
    latitude: Number,
    longitude: Number,
  },
  { _id: false }
);

const tripAuditSchema = new mongoose.Schema(
  {
    ambulanceNumberPlate: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    ambulanceType: { type: String, required: true },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChecklistTemplate',
      required: true,
    },
    templateVersion: { type: Number, required: true },
    emtUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tripMeta: { type: tripMetaSchema, default: () => ({}) },
    responses: [responseSchema],
    complianceScore: { type: Number, default: 0, min: 0, max: 100 },
    nonComplianceCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['SUBMITTED', 'NEED_ACTION', 'CLOSED'],
      default: 'SUBMITTED',
      index: true,
    },
    submittedAt: { type: Date },
    geo: { type: geoSchema, default: null },
  },
  { timestamps: true }
);

tripAuditSchema.index({ ambulanceNumberPlate: 1, createdAt: -1 });
tripAuditSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('TripAudit', tripAuditSchema);
