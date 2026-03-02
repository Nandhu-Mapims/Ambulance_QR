const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    issueText: { type: String, required: true, trim: true },
    actionText: { type: String, default: '', trim: true },
    evidenceUrl: { type: String, default: null },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  },
  { _id: false }
);

const correctiveActionSchema = new mongoose.Schema(
  {
    tripAuditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TripAudit',
      required: true,
      unique: true,
      index: true,
    },
    issues: [issueSchema],
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

correctiveActionSchema.index({ 'issues.status': 1 });

module.exports = mongoose.model('CorrectiveAction', correctiveActionSchema);
