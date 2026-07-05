'use strict';

const { PAGINATION } = require('../config/constants');

/**
 * Standardised success response.
 * @param {*} data
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 */
const success = (data, message = 'Success', statusCode = 200) => ({
  success: true,
  status: 'success',
  statusCode,
  message,
  data,
  timestamp: new Date().toISOString(),
});

/**
 * Standardised error response (for programmatic use, not middleware).
 * @param {string} message
 * @param {number} [statusCode=500]
 * @param {Array|null} [errors=null]
 */
const error = (message, statusCode = 500, errors = null) => ({
  success: false,
  status: statusCode < 500 ? 'fail' : 'error',
  statusCode,
  message,
  errors,
  timestamp: new Date().toISOString(),
});

/**
 * Standardised paginated list response.
 * @param {Array} data - Array of results.
 * @param {object} pagination - { page, limit, total }
 * @param {string} [message='Success']
 */
const paginated = (data, { page, limit, total }, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = parseInt(page, 10);

  return {
    success: true,
    status: 'success',
    message,
    data,
    pagination: {
      page: currentPage,
      limit: parseInt(limit, 10),
      total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Utility to send a response directly from a controller.
 * @param {object} res - Express response object.
 * @param {number} statusCode
 * @param {*} data
 * @param {string} message
 */
const send = (res, statusCode, data, message) => {
  return res.status(statusCode).json(success(data, message, statusCode));
};

module.exports = { success, error, paginated, send };
