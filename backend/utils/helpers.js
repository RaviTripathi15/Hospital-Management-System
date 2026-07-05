'use strict';

const Patient = require('../models/Patient');

/**
 * Generate a unique patient ID.
 * Format: <DISTRICT_CODE><BLOCK_CODE>-<YEAR>-<SEQUENCE>
 * Example: PTN-GOV-2024-00001
 *
 * @param {string} district
 * @param {string} block
 * @returns {Promise<string>}
 */
const generatePatientId = async (district = 'UNK', block = 'UNK') => {
  const districtCode = district.substring(0, 3).toUpperCase().replace(/\s+/g, '');
  const blockCode = block.substring(0, 3).toUpperCase().replace(/\s+/g, '');
  const year = new Date().getFullYear();
  const prefix = `${districtCode}-${blockCode}-${year}`;

  // Count existing patients with this prefix to generate sequence
  const count = await Patient.countDocuments({ patientId: { $regex: `^${prefix}` } });
  const sequence = String(count + 1).padStart(5, '0');

  return `${prefix}-${sequence}`;
};

/**
 * Generate a unique inventory item code.
 * Format: <CATEGORY_CODE>-<TIMESTAMP_BASE36>
 * Example: MED-LJ3K9
 *
 * @param {string} category
 * @returns {string}
 */
const generateItemCode = (category = 'GEN') => {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const uniquePart = Date.now().toString(36).toUpperCase();
  return `${categoryCode}-${uniquePart}`;
};

/**
 * Calculate age from a date of birth.
 *
 * @param {Date|string} dob
 * @returns {number}
 */
const calculateAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
};

/**
 * Format a date to a readable string.
 *
 * @param {Date|string} date
 * @param {string} [locale='en-IN']
 * @param {object} [options]
 * @returns {string}
 */
const formatDate = (date, locale = 'en-IN', options = {}) => {
  if (!date) return '';
  const defaults = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...options,
  };
  return new Date(date).toLocaleDateString(locale, defaults);
};

/**
 * Format a date-time to a readable string.
 */
const formatDateTime = (date, locale = 'en-IN') => {
  if (!date) return '';
  return new Date(date).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Sanitize a string input — strip HTML tags and trim.
 *
 * @param {string} input
 * @returns {string}
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<[^>]*>/g, '')        // strip HTML tags
    .replace(/[<>"'`]/g, '')        // strip dangerous chars
    .trim();
};

/**
 * Deep sanitize all string values in an object.
 * Non-destructively returns a sanitized copy.
 *
 * @param {object} obj
 * @returns {object}
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((v) => (typeof v === 'object' ? sanitizeObject(v) : v));
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Get start and end dates for a period.
 * @param {'today'|'week'|'month'|'year'} period
 * @returns {{ start: Date, end: Date }}
 */
const getPeriodDates = (period) => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case 'today':
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    default:
      break;
  }

  return { start, end };
};

/**
 * Pick specific fields from an object.
 * @param {object} obj
 * @param {string[]} fields
 * @returns {object}
 */
const pick = (obj, fields) => {
  const result = {};
  fields.forEach((f) => { if (obj[f] !== undefined) result[f] = obj[f]; });
  return result;
};

/**
 * Omit specific fields from an object.
 */
const omit = (obj, fields) => {
  const result = { ...obj };
  fields.forEach((f) => delete result[f]);
  return result;
};

/**
 * Sleep for N milliseconds (useful for retry logic).
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  generatePatientId,
  generateItemCode,
  calculateAge,
  formatDate,
  formatDateTime,
  sanitizeInput,
  sanitizeObject,
  getPeriodDates,
  pick,
  omit,
  sleep,
};
