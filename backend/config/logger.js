'use strict';

const winston = require('winston');
const path = require('path');
const fs = require('fs');

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors, json, splat } = winston.format;

// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

// Custom log format for files (JSON)
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  json()
);

const logger = winston.createLogger({
  level: LOG_LEVEL,
  levels: {
    ...winston.config.npm.levels,
    http: 5, // add custom http level between verbose and silly
  },
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    splat()
  ),
  transports: [
    // ─── Console ──────────────────────────────────────────────────────────
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
      silent: process.env.NODE_ENV === 'test',
    }),

    // ─── Combined log (all levels) ────────────────────────────────────────
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 14,
      tailable: true,
    }),

    // ─── Error log ────────────────────────────────────────────────────────
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 30,
      tailable: true,
    }),

    // ─── HTTP access log ──────────────────────────────────────────────────
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'access.log'),
      level: 'http',
      format: fileFormat,
      maxsize: 20 * 1024 * 1024,
      maxFiles: 7,
      tailable: true,
    }),
  ],
  exitOnError: false,
});

// Add color support for http level
winston.addColors({ http: 'magenta' });

module.exports = logger;
