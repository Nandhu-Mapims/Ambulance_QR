const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['EMT', 'SUPERVISOR', 'ADMIN', 'ASSESSOR_VIEW'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,   // this creates the index; no need for schema.index({ email: 1 }) below
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ROLES, required: true },
    station: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    // Hashed refresh token stored server-side for token rotation / revocation
    refreshTokenHash: { type: String, default: null, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokenHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
