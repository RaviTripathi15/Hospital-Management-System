'use strict';

const { validationResult, body, param, query } = require('express-validator');
const { AppError } = require('./errorHandler');
const { HTTP, ROLES, GENDERS, BLOOD_GROUPS, CENTER_TYPES, APPOINTMENT_TYPES, INVENTORY_CATEGORIES } = require('../config/constants');

/**
 * Run express-validator checks and return 422 if any fail.
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new AppError('Validation failed.', HTTP.UNPROCESSABLE, formatted));
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────
const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ min: 2, max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must include uppercase, lowercase, number, and special character.'),
  body('role').optional().isIn(Object.values(ROLES)).withMessage('Invalid role.'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number.'),
  validate,
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  validate,
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must include uppercase, lowercase, number, and special character.'),
  validate,
];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  validate,
];

// ─── User Validators ──────────────────────────────────────────────────────────
const createUserValidator = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('role').isIn(Object.values(ROLES)).withMessage('Invalid role.'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number.'),
  validate,
];

const updateUserValidator = [
  body('name').optional().trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number.'),
  body('district').optional().trim().notEmpty(),
  validate,
];

// ─── Health Centre Validators ─────────────────────────────────────────────────
const createCenterValidator = [
  body('name').trim().notEmpty().withMessage('Health centre name is required.'),
  body('type').isIn(Object.values(CENTER_TYPES)).withMessage('Invalid centre type.'),
  body('district').trim().notEmpty().withMessage('District is required.'),
  body('block').trim().notEmpty().withMessage('Block is required.'),
  body('contactNumber').notEmpty().withMessage('Valid contact number is required.'),
  body('coordinates.lat').optional().isFloat({ min: -90, max: 90 }),
  body('coordinates.lng').optional().isFloat({ min: -180, max: 180 }),
  body('totalBeds').optional().isInt({ min: 0 }).withMessage('Total beds must be a non-negative integer.'),
  body('availableBeds').optional().isInt({ min: 0 }).withMessage('Available beds must be a non-negative integer.'),
  body('doctorCount').optional().isInt({ min: 0 }).withMessage('Doctor count must be a non-negative integer.'),
  body('staffCount').optional().isInt({ min: 0 }).withMessage('Staff count must be a non-negative integer.'),
  validate,
];

// ─── Patient Validators ───────────────────────────────────────────────────────
const createPatientValidator = [
  body('name').trim().notEmpty().withMessage('Patient name is required.'),
  body('age').optional().isInt({ min: 0, max: 150 }).withMessage('Age must be 0-150.'),
  body('gender').isIn(Object.values(GENDERS)).withMessage('Invalid gender.'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number.'),
  body('bloodGroup').optional().isIn(BLOOD_GROUPS).withMessage('Invalid blood group.'),
  body('dob').optional().isISO8601().withMessage('Invalid date of birth.'),
  validate,
];

// ─── Inventory Validators ─────────────────────────────────────────────────────
const createInventoryValidator = [
  body('itemName').trim().notEmpty().withMessage('Item name is required.'),
  body('category').isIn(Object.values(INVENTORY_CATEGORIES)).withMessage('Invalid category.'),
  body('currentStock').isInt({ min: 0 }).withMessage('Current stock must be a non-negative integer.'),
  body('minStockLevel').isInt({ min: 0 }).withMessage('Min stock level must be a non-negative integer.'),
  body('dailyUsage').optional().isInt({ min: 0 }).withMessage('Daily usage must be a non-negative integer.'),
  body('unit').trim().notEmpty().withMessage('Unit is required.'),
  body('healthCenter').isMongoId().withMessage('Valid health centre ID is required.'),
  validate,
];

const updateStockValidator = [
  body('quantity').isInt().withMessage('Quantity must be an integer.'),
  body('operation').isIn(['add', 'subtract', 'set']).withMessage('Operation must be add, subtract, or set.'),
  validate,
];

// ─── Appointment Validators ───────────────────────────────────────────────────
const createAppointmentValidator = [
  body('patient').isMongoId().withMessage('Valid patient ID is required.'),
  body('healthCenter').isMongoId().withMessage('Valid health centre ID is required.'),
  body('date').isISO8601().withMessage('Valid date is required.'),
  body('timeSlot').trim().notEmpty().withMessage('Time slot is required.'),
  body('type').isIn(Object.values(APPOINTMENT_TYPES)).withMessage('Invalid appointment type.'),
  validate,
];

// ─── Pagination / Query Validators ───────────────────────────────────────────
const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100.'),
  validate,
];

const mongoIdParam = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}.`),
  validate,
];

const allocateBedValidator = [
  body('patient').isMongoId().withMessage('Valid patient ID is required.'),
  body('healthCenter').isMongoId().withMessage('Valid health center ID is required.'),
  body('bedNumber').trim().notEmpty().withMessage('Bed number is required.'),
  body('wardName').trim().notEmpty().withMessage('Ward name is required.'),
  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  createUserValidator,
  updateUserValidator,
  createCenterValidator,
  createPatientValidator,
  createInventoryValidator,
  updateStockValidator,
  createAppointmentValidator,
  allocateBedValidator,
  paginationValidator,
  mongoIdParam,
};
