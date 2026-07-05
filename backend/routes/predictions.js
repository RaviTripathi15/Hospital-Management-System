'use strict';

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const PredictionController = require('../controllers/predictionController');
const { protect } = require('../middleware/auth');

/**
 * All routes require authentication
 */
router.use(protect);

/**
 * GET /api/v1/predictions/dashboard
 * Get all predictions for dashboard
 */
router.get('/dashboard', PredictionController.getDashboardPredictions);

/**
 * GET /api/v1/predictions/risk-assessment
 * Get overall risk assessment
 */
router.get('/risk-assessment', PredictionController.getRiskAssessment);

/**
 * GET /api/v1/predictions/medicine-demand/:itemId
 * Predict medicine demand for specific item
 * Query: daysAhead (default: 30)
 */
router.get(
  '/medicine-demand/:itemId',
  param('itemId').isMongoId().withMessage('Invalid item ID'),
  query('daysAhead')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days ahead must be between 1 and 365'),
  PredictionController.getMedicineDemandPrediction
);

/**
 * GET /api/v1/predictions/stock-out-warning
 * Get early stock-out warnings
 * Query: thresholdDays (default: 7)
 */
router.get(
  '/stock-out-warning',
  query('thresholdDays')
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage('Threshold days must be between 1 and 90'),
  PredictionController.getStockOutWarnings
);

/**
 * GET /api/v1/predictions/patient-footfall
 * Predict patient footfall trends
 * Query: daysAhead (default: 30), department (optional)
 */
router.get(
  '/patient-footfall',
  query('daysAhead')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days ahead must be between 1 and 365'),
  query('department')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Department must not be empty'),
  PredictionController.getPatientFootfallPrediction
);

/**
 * GET /api/v1/predictions/doctor-requirement
 * Predict doctor staffing requirement
 * Query: daysAhead (default: 30), department (optional)
 */
router.get(
  '/doctor-requirement',
  query('daysAhead')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days ahead must be between 1 and 365'),
  query('department')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Department must not be empty'),
  PredictionController.getDoctorRequirementPrediction
);

/**
 * GET /api/v1/predictions/bed-requirement
 * Predict bed requirement
 * Query: daysAhead (default: 30)
 */
router.get(
  '/bed-requirement',
  query('daysAhead')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days ahead must be between 1 and 365'),
  PredictionController.getBedRequirementPrediction
);

/**
 * POST /api/v1/predictions/batch-medicine
 * Get batch medicine demand predictions
 * Body: itemIds (array), daysAhead (optional)
 */
router.post(
  '/batch-medicine',
  body('itemIds')
    .isArray({ min: 1 })
    .withMessage('Item IDs must be a non-empty array'),
  body('itemIds.*')
    .isMongoId()
    .withMessage('All item IDs must be valid MongoDB IDs'),
  body('daysAhead')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days ahead must be between 1 and 365'),
  PredictionController.getBatchMedicinePredictions
);

module.exports = router;
