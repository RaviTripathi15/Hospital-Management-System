'use strict';

const rateLimit = require('express-rate-limit');
const { HTTP } = require('../config/constants');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000; // 15 minutes

const createLimiter = (options) =>
  rateLimit({
    windowMs,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(HTTP.TOO_MANY_REQUESTS).json({
        success: false,
        status: 'fail',
        message: options.message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
    skip: () => process.env.NODE_ENV === 'test',
    ...options,
  });

/**
 * General API limiter — 100 requests per window per IP.
 */
const apiLimiter = createLimiter({
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  message: 'Too many API requests from this IP. Please try again after 15 minutes.',
});

/**
 * Stricter limiter for auth endpoints — 10 requests per window per IP.
 */
const authLimiter = createLimiter({
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
});

/**
 * Password reset limiter — 5 requests per window per IP.
 */
const passwordResetLimiter = createLimiter({
  max: 5,
  message: 'Too many password reset requests. Please try again after 15 minutes.',
});

/**
 * Report generation limiter — 20 requests per window per IP.
 */
const reportLimiter = createLimiter({
  max: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many report generation requests. Please try again after 1 hour.',
});

/**
 * Analytics/AI limiter — 30 requests per window per IP.
 */
const analyticsLimiter = createLimiter({
  max: 30,
  message: 'Too many analytics requests. Please try again later.',
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  reportLimiter,
  analyticsLimiter,
};
