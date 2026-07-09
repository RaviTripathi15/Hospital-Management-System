'use strict';

const logger = require('../config/logger');
const { HTTP } = require('../config/constants');

// ─── Custom Error Class ───────────────────────────────────────────────────────
class AppError extends Error {
  constructor(message, statusCode = HTTP.SERVER_ERROR, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors; // field-level validation errors
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Async Handler Wrapper ────────────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ─── Specific Error Transformers ──────────────────────────────────────────────
const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, HTTP.BAD_REQUEST);

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : 'unknown';
  return new AppError(
    `Duplicate value for ${field}: "${value}". Please use a different value.`,
    HTTP.CONFLICT
  );
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return new AppError('Validation failed.', HTTP.UNPROCESSABLE, errors);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', HTTP.UNAUTHORIZED);

const handleJWTExpiredError = () =>
  new AppError('Token has expired. Please log in again.', HTTP.UNAUTHORIZED);

// ─── Dev vs. Prod error response ─────────────────────────────────────────────
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    errors: err.errors || undefined,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      errors: err.errors || undefined,
    });
  } else {
    // Don't leak internal details in production
    logger.error('UNEXPECTED ERROR:', err);
    res.status(HTTP.SERVER_ERROR).json({
      success: false,
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }
};

const errorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || HTTP.SERVER_ERROR;
  err.status = err.status || 'error';

  // Log 404 errors as warnings to prevent log clutter in production
  if (err.statusCode === HTTP.NOT_FOUND) {
    logger.warn(`404 ${err.message} [${req.method} ${req.originalUrl}]`);
  } else {
    logger.error(`${err.statusCode} ${err.message} [${req.method} ${req.originalUrl}]`, {
      stack: err.stack,
      user: req.user ? req.user._id : 'unauthenticated',
    });
  }

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, res);
  }

  // Transform known Mongoose/JWT errors
  let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
  error.message = err.message;

  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  sendErrorProd(error, res);
};

// ─── 404 Handler ─────────────────────────────────────────────────────────────
const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, HTTP.NOT_FOUND));
};

module.exports = { AppError, asyncHandler, errorHandler, notFound };
