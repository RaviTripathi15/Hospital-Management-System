'use strict';

/**
 * Custom middleware to recursively sanitize keys in an object to prevent NoSQL Injection.
 * It deletes any keys that start with '$' or contain '.'.
 */
const sanitize = (obj) => {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitize(obj[key]);
      }
    });
  }
};

const nosqlSanitizer = (req, _res, next) => {
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
};

module.exports = nosqlSanitizer;
