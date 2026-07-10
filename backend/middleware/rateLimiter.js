'use strict';

const rateLimit = require('express-rate-limit');
const { HTTP } = require('../config/constants');

// Window for all limiters (default 15 minutes)
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;

/**
 * Factory that creates a configured rate-limiter.
 *
 * Key production fix:
 *   - validate: false — suppresses the ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
 *     error that express-rate-limit v7 throws when it detects
 *     X-Forwarded-For headers coming through Render's load-balancer proxy.
 *     We already set `app.set('trust proxy', 1)` in server.js so the IP
 *     resolution is correct; we simply tell the limiter to trust that config
 *     rather than running its own validation check.
 *
 *   - standardHeaders: 'draft-7' — sends RateLimit-* headers (RFC-compliant)
 *   - legacyHeaders: false      — suppresses the deprecated X-RateLimit-* set
 */
const createLimiter = (options) =>
  rateLimit({
    windowMs,
    standardHeaders: 'draft-7',   // RFC-compliant RateLimit headers
    legacyHeaders: false,          // Disable deprecated X-RateLimit-* headers
    // ─── CRITICAL FOR RENDER ────────────────────────────────────────────────
    // Render's reverse proxy injects X-Forwarded-For before requests reach
    // our Express app.  express-rate-limit v7 validates that this is expected
    // when `validate.trustProxy` is true.  Setting `validate: false` skips
    // the ERR_ERL_UNEXPECTED_X_FORWARDED_FOR safety check entirely because
    // we have already set `app.set('trust proxy', 1)` in server.js.
    validate: { trustProxy: false },
    // ────────────────────────────────────────────────────────────────────────
    handler: (_req, res) => {
      res.status(HTTP.TOO_MANY_REQUESTS).json({
        success: false,
        status: 'fail',
        message: options.message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
    // Skip the limiter completely in test runs so Jest tests are not affected
    skip: () => process.env.NODE_ENV === 'test',
    ...options,
  });

/**
 * General API limiter — 100 requests per 15-minute window per IP.
 * Applied at the /api/* path level.
 */
const apiLimiter = createLimiter({
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  message: 'Too many API requests from this IP. Please try again after 15 minutes.',
});

/**
 * Auth limiter — 10 attempts per 15-minute window per IP.
 * Applied to POST /auth/login and POST /auth/register.
 * Successful requests are NOT counted (skipSuccessfulRequests: true).
 */
const authLimiter = createLimiter({
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  skipSuccessfulRequests: true,
});

/**
 * Password-reset limiter — 5 requests per 15-minute window per IP.
 * Applied to POST /auth/forgot-password and PUT /auth/reset-password/:token.
 */
const passwordResetLimiter = createLimiter({
  max: 5,
  message: 'Too many password reset requests. Please try again after 15 minutes.',
});

/**
 * Report generation limiter — 20 requests per hour per IP.
 */
const reportLimiter = createLimiter({
  max: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many report generation requests. Please try again after 1 hour.',
});

/**
 * Analytics / AI limiter — 30 requests per 15-minute window per IP.
 * AI operations are compute-heavy so we cap them more aggressively.
 */
const analyticsLimiter = createLimiter({
  max: 30,
  message: 'Too many analytics requests from this IP. Please try again later.',
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  reportLimiter,
  analyticsLimiter,
};
