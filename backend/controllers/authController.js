'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success, error: apiError } = require('../utils/apiResponse');
const { sendEmail } = require('../services/emailService');
const logger = require('../config/logger');
const { HTTP } = require('../config/constants');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(statusCode).json(
    success(
      {
        accessToken,
        refreshToken,
        user: user.toPublic(),
      },
      'Authentication successful.'
    )
  );
};

// ─── @route POST /api/v1/auth/register ───────────────────────────────────────
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone, district, healthCenter } = req.body;

  // Only super_admin can create other admins via register endpoint
  if ((role === 'super_admin' || role === 'district_admin') && (!req.user || req.user.role !== 'super_admin')) {
    return next(new AppError('You cannot self-register with an admin role.', HTTP.FORBIDDEN));
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return next(new AppError('Email already registered.', HTTP.CONFLICT));
  }

  const user = await User.create({ name, email, password, role, phone, district, healthCenter });

  logger.info(`New user registered: ${user.email} (${user.role})`);
  sendTokenResponse(user, HTTP.CREATED, res);
});

// ─── @route POST /api/v1/auth/login ──────────────────────────────────────────
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return next(new AppError('Invalid credentials.', HTTP.UNAUTHORIZED));
  }

  if (!user.isActive) {
    return next(new AppError('Account deactivated. Contact support.', HTTP.FORBIDDEN));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid credentials.', HTTP.UNAUTHORIZED));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${user.email}`);
  sendTokenResponse(user, HTTP.OK, res);
});

// ─── @route POST /api/v1/auth/logout ─────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  // Clear refresh token cookie
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(HTTP.OK).json(success(null, 'Logged out successfully.'));
});

// ─── @route GET /api/v1/auth/me ───────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('healthCenter', 'name type district');
  return res.status(HTTP.OK).json(success(user.toPublic(), 'Profile retrieved.'));
});

// ─── @route PUT /api/v1/auth/profile ─────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'gender', 'district'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (req.file) {
    updates.profilePic = `/uploads/profiles/${req.file.filename}`;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).populate('healthCenter', 'name type district');

  return res.status(HTTP.OK).json(success(user.toPublic(), 'Profile updated.'));
});

// ─── @route PUT /api/v1/auth/change-password ─────────────────────────────────
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new AppError('Current password is incorrect.', HTTP.UNAUTHORIZED));
  }

  user.password = newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);
  return res.status(HTTP.OK).json(success(null, 'Password changed successfully.'));
});

// ─── @route POST /api/v1/auth/forgot-password ────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (!user) {
    // Don't reveal whether user exists
    return res.status(HTTP.OK).json(success(null, 'If that email exists, a reset link has been sent.'));
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Health Platform — Password Reset',
      template: 'passwordReset',
      data: { name: user.name, resetUrl, expiryMinutes: 10 },
    });
  } catch (err) {
    // Rollback token if email fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    logger.error(`Failed to send reset email to ${user.email}: ${err.message}`);
    return next(new AppError('Email could not be sent. Try again later.', HTTP.SERVER_ERROR));
  }

  return res.status(HTTP.OK).json(success(null, 'Password reset link sent to your email.'));
});

// ─── @route PUT /api/v1/auth/reset-password/:token ───────────────────────────
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Invalid or expired reset token.', HTTP.BAD_REQUEST));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  logger.info(`Password reset for user: ${user.email}`);
  sendTokenResponse(user, HTTP.OK, res);
});

// ─── @route POST /api/v1/auth/refresh-token ──────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  if (!token) {
    return next(new AppError('No refresh token provided.', HTTP.UNAUTHORIZED));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token.', HTTP.UNAUTHORIZED));
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    return next(new AppError('User not found or inactive.', HTTP.UNAUTHORIZED));
  }

  const accessToken = user.getSignedJwtToken();
  return res.status(HTTP.OK).json(success({ accessToken }, 'Token refreshed.'));
});
