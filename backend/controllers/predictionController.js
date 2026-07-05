'use strict';

const PredictionService = require('../services/predictionService');
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../config/logger');

class PredictionController {
  /**
   * GET /api/v1/predictions/medicine-demand/:itemId
   * Predict medicine demand for specific item
   */
  static async getMedicineDemandPrediction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation failed', 400, errors.array());
      }

      const { itemId } = req.params;
      const { healthCenterId } = req.user;
      const { daysAhead = 30 } = req.query;

      const prediction = await PredictionService.predictMedicineDemand(
        healthCenterId,
        itemId,
        parseInt(daysAhead)
      );

      logger.info(`Medicine demand prediction generated for item: ${itemId}`);

      return successResponse(res, prediction, 'Medicine demand prediction generated successfully');
    } catch (error) {
      logger.error(`Medicine demand prediction error: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * GET /api/v1/predictions/stock-out-warning
   * Get early stock-out warnings
   */
  static async getStockOutWarnings(req, res) {
    try {
      const { healthCenterId } = req.user;
      const { thresholdDays = 7 } = req.query;

      const warnings = await PredictionService.predictStockOut(
        healthCenterId,
        parseInt(thresholdDays)
      );

      logger.info(
        `Stock-out warnings retrieved for health center: ${healthCenterId}. Found ${warnings.length} warnings.`
      );

      return successResponse(
        res,
        {
          totalWarnings: warnings.length,
          warnings,
          generatedAt: new Date(),
        },
        'Stock-out warnings retrieved successfully'
      );
    } catch (error) {
      logger.error(`Stock-out warning retrieval error: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * GET /api/v1/predictions/patient-footfall
   * Predict patient footfall trends
   */
  static async getPatientFootfallPrediction(req, res) {
    try {
      const { healthCenterId } = req.user;
      const { daysAhead = 30, department } = req.query;

      const prediction = await PredictionService.predictPatientFootfall(
        healthCenterId,
        parseInt(daysAhead),
        department || null
      );

      logger.info(
        `Patient footfall prediction generated for health center: ${healthCenterId}`
      );

      return successResponse(
        res,
        prediction,
        'Patient footfall prediction generated successfully'
      );
    } catch (error) {
      logger.error(`Patient footfall prediction error: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * GET /api/v1/predictions/doctor-requirement
   * Predict doctor staffing requirement
   */
  static async getDoctorRequirementPrediction(req, res) {
    try {
      const { healthCenterId } = req.user;
      const { daysAhead = 30, department } = req.query;

      const prediction = await PredictionService.predictDoctorRequirement(
        healthCenterId,
        parseInt(daysAhead),
        department || null
      );

      logger.info(
        `Doctor requirement prediction generated for health center: ${healthCenterId}`
      );

      return successResponse(
        res,
        prediction,
        'Doctor requirement prediction generated successfully'
      );
    } catch (error) {
      logger.error(`Doctor requirement prediction error: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * GET /api/v1/predictions/bed-requirement
   * Predict bed requirement
   */
  static async getBedRequirementPrediction(req, res) {
    try {
      const { healthCenterId } = req.user;
      const { daysAhead = 30 } = req.query;

      const prediction = await PredictionService.predictBedRequirement(
        healthCenterId,
        parseInt(daysAhead)
      );

      logger.info(`Bed requirement prediction generated for health center: ${healthCenterId}`);

      return successResponse(
        res,
        prediction,
        'Bed requirement prediction generated successfully'
      );
    } catch (error) {
      logger.error(`Bed requirement prediction error: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * GET /api/v1/predictions/dashboard
   * Get all predictions for dashboard
   */
  static async getDashboardPredictions(req, res) {
    try {
      const { healthCenterId } = req.user;
      const { daysAhead = 30 } = req.query;

      const [footfallPrediction, doctorPrediction, bedPrediction, stockOutWarnings] =
        await Promise.all([
          PredictionService.predictPatientFootfall(healthCenterId, parseInt(daysAhead)),
          PredictionService.predictDoctorRequirement(healthCenterId, parseInt(daysAhead)),
          PredictionService.predictBedRequirement(healthCenterId, parseInt(daysAhead)),
          PredictionService.predictStockOut(healthCenterId, 7),
        ]);

      logger.info(`Dashboard predictions generated for health center: ${healthCenterId}`);

      return successResponse(
        res,
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
      );
    } catch (error) {
      logger.error(`Dashboard predictions error: ${error.message}`);
      return errorResponse(res, error.message, 500);
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
        return errorResponse(res, 'Validation failed', 400, errors.array());
      }

      const { healthCenterId } = req.user;
      const { itemIds = [], daysAhead = 30 } = req.body;

      const predictions = await Promise.all(
        itemIds.map((itemId) =>
          PredictionService.predictMedicineDemand(healthCenterId, itemId, parseInt(daysAhead))
        )
      );

      logger.info(
        `Batch medicine demand predictions generated for ${itemIds.length} items in health center: ${healthCenterId}`
      );

      return successResponse(
        res,
        {
          totalItems: itemIds.length,
          predictions,
          generatedAt: new Date(),
        },
        'Batch medicine demand predictions generated successfully'
      );
    } catch (error) {
      logger.error(`Batch medicine prediction error: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * GET /api/v1/predictions/risk-assessment
   * Get overall risk assessment
   */
  static async getRiskAssessment(req, res) {
    try {
      const { healthCenterId } = req.user;

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

      return successResponse(
        res,
        {
          overallRiskScore,
          riskLevel:
            overallRiskScore > 70 ? 'Critical' : overallRiskScore > 50 ? 'High' : 'Moderate',
          criticalIssues,
          lastAssessment: new Date(),
        },
        'Risk assessment retrieved successfully'
      );
    } catch (error) {
      logger.error(`Risk assessment error: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = PredictionController;
