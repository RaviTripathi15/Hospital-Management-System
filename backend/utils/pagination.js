'use strict';

const { PAGINATION } = require('../config/constants');

/**
 * Extract and sanitize pagination parameters from the request query.
 *
 * @param {object} query - req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
const getPaginationParams = (query = {}) => {
  let page = parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE;
  let limit = parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT;

  // Clamp values
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > PAGINATION.MAX_LIMIT) limit = PAGINATION.MAX_LIMIT;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Apply pagination to a Mongoose query.
 *
 * @param {mongoose.Query} query - A Mongoose query (e.g., Model.find())
 * @param {object} reqQuery - req.query with optional `page` and `limit`
 * @returns {{ query: mongoose.Query, pagination: object }}
 */
const paginateQuery = (mongooseQuery, reqQuery = {}) => {
  const { page, limit, skip } = getPaginationParams(reqQuery);
  return {
    query: mongooseQuery.skip(skip).limit(limit),
    meta: { page, limit, skip },
  };
};

/**
 * Build a pagination metadata object from total count and params.
 *
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @returns {object}
 */
const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  };
};

module.exports = { getPaginationParams, paginateQuery, buildPaginationMeta };
