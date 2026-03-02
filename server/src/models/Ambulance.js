const mongoose = require('mongoose');

const AMBULANCE_TYPES = ['BLS', 'ALS', 'ICU', 'NEONATAL', 'TRANSPORT'];

const ambulanceSchema = new mongoose.Schema(
  {
    numberPlate: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: { type: String, enum: AMBULANCE_TYPES, required: true },
    station: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    // SHA-256 hash of the raw QR token (raw token is never stored)
    qrTokenHash: { type: String, default: null, select: false },
    lastQrRotatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ambulance', ambulanceSchema);
module.exports.AMBULANCE_TYPES = AMBULANCE_TYPES;
