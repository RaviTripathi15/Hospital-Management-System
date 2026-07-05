'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, asyncHandler } = require('./errorHandler');
const { HTTP, ROLE_HIERARCHY } = require('../config/constants');

/**
 * Verify JWT access token and attach user to request.
 */
const protect = asyncHandler(async (req, _res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized — no token provided.', HTTP.UNAUTHORIZED));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please log in again.', HTTP.UNAUTHORIZED));
    }
    return next(new AppError('Invalid token.', HTTP.UNAUTHORIZED));
  }

  const user = await User.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpire');

  if (!user) {
    return next(new AppError('User not found for this token.', HTTP.UNAUTHORIZED));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Contact support.', HTTP.FORBIDDEN));
  }

  req.user = user;
  next();
});

/**
 * Require an exact role.
 * @param {...string} roles - Allowed roles.
 */
const requireRole = (...roles) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', HTTP.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${roles.join(', ')}.`,
          HTTP.FORBIDDEN
        )
      );
    }

    next();
  });

/**
 * Require that the user's role is at or above a minimum in the hierarchy.
 * @param {string} minRole - Minimum role in the hierarchy.
 */
const requireMinRole = (minRole) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', HTTP.UNAUTHORIZED));
    }

    const userRank = ROLE_HIERARCHY.indexOf(req.user.role);
    const minRank = ROLE_HIERARCHY.indexOf(minRole);

    if (userRank < minRank) {
      return next(
        new AppError(
          `Access denied. Minimum required role: ${minRole}.`,
          HTTP.FORBIDDEN
        )
      );
    }

    next();
  });

/**
 * Allow access if the user has any of the provided roles.
 * @param {...string} roles
 */
const requireAnyRole = (...roles) => requireRole(...roles);

/**
 * Ensure the requesting user can only access their own resource
 * OR has a sufficient elevated role.
 * @param {string} minRoleBypass - Role that can bypass ownership check.
 */
const requireOwnerOrRole = (minRoleBypass) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', HTTP.UNAUTHORIZED));
    }

    const userRank = ROLE_HIERARCHY.indexOf(req.user.role);
    const bypassRank = ROLE_HIERARCHY.indexOf(minRoleBypass);

    if (userRank >= bypassRank) {
      return next(); // Elevated role bypasses ownership check
    }

    const resourceId = req.params.id || req.params.userId;
    if (req.user._id.toString() !== resourceId) {
      return next(new AppError('Access denied. You can only access your own resources.', HTTP.FORBIDDEN));
    }

    next();
  });

/**
 * Optional auth — attach user if token present but don't error if missing.
 */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpire');
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (_err) {
    // Silently ignore invalid token in optional auth
  }

  next();
});

module.exports = { protect, requireRole, requireMinRole, requireAnyRole, requireOwnerOrRole, optionalAuth };
