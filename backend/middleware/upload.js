'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorHandler');
const { HTTP } = require('../config/constants');

const UPLOAD_DIR = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024; // 5 MB

// Ensure base upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Storage Factory ──────────────────────────────────────────────────────────
const createStorage = (subDir) => {
  const dir = path.join(UPLOAD_DIR, subDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });
};

// ─── File Filters ─────────────────────────────────────────────────────────────
const imageFilter = (_req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const isValid =
    allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
    allowedTypes.test(file.mimetype);

  if (isValid) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (jpeg, jpg, png, gif, webp) are allowed.', HTTP.BAD_REQUEST));
  }
};

const documentFilter = (_req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (isValid) {
    cb(null, true);
  } else {
    cb(new AppError('Only images and documents (pdf, doc, xls) are allowed.', HTTP.BAD_REQUEST));
  }
};

// ─── Upload Middleware Instances ──────────────────────────────────────────────

/** Profile picture upload — single image */
const uploadProfilePic = multer({
  storage: createStorage('profiles'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('profilePic');

/** Patient document upload — multiple docs */
const uploadPatientDocs = multer({
  storage: createStorage('patients'),
  fileFilter: documentFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 5 },
}).array('documents', 5);

/** Report attachments */
const uploadReportAttachment = multer({
  storage: createStorage('reports'),
  fileFilter: documentFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 3 },
}).array('attachments', 3);

/** Inventory images */
const uploadInventoryImage = multer({
  storage: createStorage('inventory'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('image');

/** Verification document upload — single document */
const uploadVerificationDoc = multer({
  storage: createStorage('verifications'),
  fileFilter: documentFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('verificationDoc');

// ─── Multer Error Wrapper ─────────────────────────────────────────────────────
/**
 * Wraps multer middleware so its errors are forwarded to Express error handler.
 * @param {Function} multerMiddleware
 */
const wrapMulter = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
        LIMIT_FILE_COUNT: 'Too many files uploaded.',
        LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
      };
      return next(new AppError(messages[err.code] || err.message, HTTP.BAD_REQUEST));
    }

    next(err);
  });
};

module.exports = {
  uploadProfilePic: wrapMulter(uploadProfilePic),
  uploadPatientDocs: wrapMulter(uploadPatientDocs),
  uploadReportAttachment: wrapMulter(uploadReportAttachment),
  uploadInventoryImage: wrapMulter(uploadInventoryImage),
  uploadVerificationDoc: wrapMulter(uploadVerificationDoc),
};
