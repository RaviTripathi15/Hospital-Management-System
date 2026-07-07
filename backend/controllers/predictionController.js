'use strict';

const PredictionService = require('../services/predictionService');
const { validationResult } = require('express-validator');
const { success, error } = require('../utils/apiResponse');
const logger = require('../config/logger');
const { ROLES } = require('../config/constants');

const getTargetHealthCenterId = async (req) => {
  let healthCenterId = req.query.healthCenter || req.body.healthCenter || (req.user.healthCenter ? req.user.healthCenter.toString() : null);
  if (req.user.role === ROLES.STAFF && req.user.healthCenter) {
    healthCenterId = req.user.healthCenter.toString();
  }
  if (!healthCenterId && [ROLES.SUPER_ADMIN, ROLES.DISTRICT_ADMIN].includes(req.user.role)) {
    const HealthCenter = require('../models/HealthCenter');
    const firstCenter = await HealthCenter.findOne({ isActive: true });
    if (firstCenter) {
      healthCenterId = firstCenter._id.toString();
    }
  }
  return healthCenterId;
};

class PredictionController {
  /**
   * GET /api/v1/predictions/medicine-demand/:itemId
   * Predict medicine demand for specific item
   */
  static async getMedicineDemandPrediction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(error('Validation failed', 400, errors.array()));
      }

      const { itemId } = req.params;
      const healthCenterId = await getTargetHealthCenterId(req);
      const { daysAhead = 30 } = req.query;

      if (!healthCenterId) {
        return res.status(400).json(error('User is not associated with a health center', 400));
      }

      const prediction = await PredictionService.predictMedicineDemand(
        healthCenterId,
        itemId,
        parseInt(daysAhead)
      );

      logger.info(`Medicine demand prediction generated for item: ${itemId}`);

      return res.status(200).json(success(prediction, 'Medicine demand prediction generated successfully'));
    } catch (err) {
      logger.error(`Medicine demand prediction error: ${err.message}`);
      return res.status(500).json(error(err.message, 500));
    }
  }

  /**
   * GET /api/v1/predictions/stock-out-warning
   * Get early stock-out warnings
   */
  static async getStockOutWarnings(req, res) {
    try {
      const healthCenterId = await getTargetHealthCenterId(req);
      const { thresholdDays = 7 } = req.query;

      if (!healthCenterId) {
        return res.status(400).json(error('User is not associated with a health center', 400));
      }

      const warnings = await PredictionService.predictStockOut(
        healthCenterId,
        parseInt(thresholdDays)
      );

      logger.info(
        `Stock-out warnings retrieved for health center: ${healthCenterId}. Found ${warnings.length} warnings.`
      );

      return res.status(200).json(
        success(
          {
            totalWarnings: warnings.length,
            warnings,
            generatedAt: new Date(),
          },
          'Stock-out warnings retrieved successfully'
        )
      );
    } catch (err) {
      logger.error(`Stock-out warning retrieval error: ${err.message}`);
      return res.status(500).json(error(err.message, 500));
    }
  }

  /**
   * GET /api/v1/predictions/patient-footfall
   * Predict patient footfall trends
   */
  static async getPatientFootfallPrediction(req, res) {
    try {
      const healthCenterId = await getTargetHealthCenterId(req);
      const { daysAhead = 30, department } = req.query;

      if (!healthCenterId) {
        return res.status(400).json(error('User is not associated with a health center', 400));
      }

      const prediction = await PredictionService.predictPatientFootfall(
        healthCenterId,
        parseInt(daysAhead),
        department || null
      );

      logger.info(
        `Patient footfall prediction generated for health center: ${healthCenterId}`
      );

      return res.status(200).json(
        success(
          prediction,
          'Patient footfall prediction generated successfully'
        )
      );
    } catch (err) {
      logger.error(`Patient footfall prediction error: ${err.message}`);
      return res.status(500).json(error(err.message, 500));
    }
  }

  /**
   * GET /api/v1/predictions/doctor-requirement
   * Predict doctor staffing requirement
   */
  static async getDoctorRequirementPrediction(req, res) {
    try {
      const healthCenterId = await getTargetHealthCenterId(req);
      const { daysAhead = 30, department } = req.query;

      if (!healthCenterId) {
        return res.status(400).json(error('User is not associated with a health center', 400));
      }

      const prediction = await PredictionService.predictDoctorRequirement(
        healthCenterId,
        parseInt(daysAhead),
        department || null
      );

      logger.info(
        `Doctor requirement prediction generated for health center: ${healthCenterId}`
      );

      return res.status(200).json(
        success(
          prediction,
          'Doctor requirement prediction generated successfully'
        )
      );
    } catch (err) {
      logger.error(`Doctor requirement prediction error: ${err.message}`);
      return res.status(500).json(error(err.message, 500));
    }
  }

  /**
   * GET /api/v1/predictions/bed-requirement
   * Predict bed requirement
   */
  static async getBedRequirementPrediction(req, res) {
    try {
      const healthCenterId = await getTargetHealthCenterId(req);
      const { daysAhead = 30 } = req.query;

      if (!healthCenterId) {
        return res.status(400).json(error('User is not associated with a health center', 400));
      }

      const prediction = await PredictionService.predictBedRequirement(
        healthCenterId,
        parseInt(daysAhead)
      );

      logger.info(`Bed requirement prediction generated for health center: ${healthCenterId}`);

      return res.status(200).json(
        success(
          prediction,
          'Bed requirement prediction generated successfully'
        )
      );
    } catch (err) {
      logger.error(`Bed requirement prediction error: ${err.message}`);
      return res.status(500).json(error(err.message, 500));
    }
  }

  /**
   * GET /api/v1/predictions/dashboard
   * Get all predictions for dashboard
   */
  static async getDashboardPredictions(req, res) {
    try {
      const healthCenterId = await getTargetHealthCenterId(req);
      const { daysAhead = 30 } = req.query;

      if (!healthCenterId) {
        return res.status(400).json(error('User is not associated with a health center', 400));
      }

      const [footfallPrediction, doctorPrediction, bedPrediction, stockOutWarnings] =
        await Promise.all([
          PredictionService.predictPatientFootfall(healthCenterId, parseInt(daysAhead)),
          PredictionService.predictDoctorRequirement(healthCenterId, parseInt(daysAhead)),
          PredictionService.predictBedRequirement(healthCenterId, parseInt(daysAhead)),
          PredictionService.predictStockOut(healthCenterId, 7),
        ]);

      logger.info(`Dashboard predictions generated for health center: ${healthCenterId}`);

      return res.status(200).json(
        success(
          {
            generatedAt: new Date(),
            predictions: {
              footfall: footfallPrediction,
              doctorRequirement: doctorPrediction,
              bedRequirement: bedPrediction,
              stockOutWarnings: {
                count: stockOutWarnings.length,
                items: stockOutWarnings,
              },
            },
          },
          'Dashboard predictions retrieved successfully'
        )
      );
    } catch (err) {
      logger.error(`Dashboard predictions error: ${err.message}`);
      return res.status(500).json(error(err.message, 500));
    }
  }

  /**
   * POST /api/v1/predictions/batch-medicine
   * Get batch medicine demand predictions
   */
  static async getBatchMedicinePredictions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(error('Validation failed', 400, errors.array()));
      }

      const healthCenterId = await getTargetHealthCenterId(req);
      const { itemIds = [], daysAhead = 30 } = req.body;

      if (!healthCenterId) {
        return res.status(400).json(error('User is not associated with a health center', 400));
      }

      const predictions = await Promise.all(
        itemIds.map((itemId) =>
          PredictionService.predictMedicineDemand(healthCenterId, itemId, parseInt(daysAhead))
        )
      );

      logger.info(
        `Batch medicine demand predictions generated for ${itemIds.length} items in health center: ${healthCenterId}`
      );

      return res.status(200).json(
        success(
          {
            totalItems: itemIds.length,
            predictions,
            generatedAt: new Date(),
          },
          'Batch medicine demand predictions generated successfully'
        )
      );
    } catch (err) {
      logger.error(`Batch medicine prediction error: ${err.message}`);
      return res.status(500).json(error(err.message, 500));
    }
  }

  /**
   * GET /api/v1/predictions/risk-assessment
   * Get overall risk assessment
   */
  static async getRiskAssessment(req, res) {
    try {
      const healthCenterId = await getTargetHealthCenterId(req);

      if (!healthCenterId) {
        return res.status(400).json(error('User is not associated with a health center', 400));
      }

      const [stockOutWarnings, bedPrediction, doctorPrediction] = await Promise.all([
        PredictionService.predictStockOut(healthCenterId, 7),
        PredictionService.predictBedRequirement(healthCenterId, 30),
        PredictionService.predictDoctorRequirement(healthCenterId, 30),
      ]);

      const overallRiskScore = Math.round(
        (stockOutWarnings.reduce((sum, w) => sum + w.riskScore, 0) / Math.max(stockOutWarnings.length, 1) +
          bedPrediction.riskScore +
          doctorPrediction.riskScore) /
          3
      );

      const criticalIssues = [];
      if (stockOutWarnings.length > 0) {
        criticalIssues.push({
          type: 'stock_out',
          count: stockOutWarnings.length,
          severity: 'critical',
          action: 'Review and reorder critical items',
        });
      }
      if (doctorPrediction.shortage > 0) {
        criticalIssues.push({
          type: 'doctor_shortage',
          count: doctorPrediction.shortage,
          severity: doctorPrediction.shortage > 5 ? 'critical' : 'high',
          action: 'Arrange for additional staff',
        });
      }
      if (bedPrediction.riskScore > 70) {
        criticalIssues.push({
          type: 'bed_shortage',
          severity: 'high',
          action: 'Prepare for bed expansion or patient transfer',
        });
      }

      logger.info(
        `Risk assessment generated for health center: ${healthCenterId}. Overall risk score: ${overallRiskScore}`
      );

      return res.status(200).json(
        success(
          {
            overallRiskScore,
            riskLevel:
              overallRiskScore > 70 ? 'Critical' : overallRiskScore > 50 ? 'High' : 'Moderate',
            criticalIssues,
            lastAssessment: new Date(),
          },
          'Risk assessment retrieved successfully'
        )
      );
    } catch (err) {
      logger.error(`Risk assessment error: ${err.message}`);
      return res.status(500).json(error(err.message, 500));
    }
  }
}

module.exports = PredictionController;