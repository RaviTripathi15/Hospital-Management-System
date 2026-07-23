'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ROLES, GENDERS } = require('../config/constants');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email.'],
    },
    password: {
      type: String,
      required: [
        function () {
          return this.authProvider === 'local';
        },
        'Password is required.',
      ],
      minlength: [8, 'Password must be at least 8 characters.'],
      select: false, // Never return password in queries
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CITIZEN,
    },
    healthCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthCenter',
      default: null,
    },
    district: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[\d\s\-().]{7,20}$/, 'Please enter a valid phone number.'],
      default: null,
    },
    gender: {
      type: String,
      enum: [...Object.values(GENDERS), null],
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profilePic: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // Refresh token storage (hashed)
    refreshToken: {
      type: String,
      select: false,
      default: null,
    },
    // Password reset
    resetPasswordToken: {
      type: String,
      select: false,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// email has unique: true in schema, so no separate index needed
UserSchema.index({ role: 1 });
UserSchema.index({ healthCenter: 1 });
UserSchema.index({ district: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// ─── Pre-save Hook: Hash Password ─────────────────────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/** Compare plain password with hashed password. */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/** Generate JWT access token (short-lived). */
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );
};

/** Generate JWT refresh token (long-lived). */
UserSchema.methods.getRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

/** Generate and return plain-text password reset token; stores hashed version. */
UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

/** Safe public representation (no password/tokens). */
UserSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.refreshToken;
  return obj;
};

// ─── Virtual ──────────────────────────────────────────────────────────────────
UserSchema.virtual('displayName').get(function () {
  return this.name;
});

module.exports = mongoose.model('User', UserSchema);
