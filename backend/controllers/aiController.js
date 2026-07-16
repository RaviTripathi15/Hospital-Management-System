'use strict';

const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/apiResponse');
const aiService = require('../services/aiService');
const { HTTP, ROLES } = require('../config/constants');
const HealthCenter = require('../models/HealthCenter');

// ─── @route GET /api/v1/ai/demand-forecast ───────────────────────────────────
exports.getDemandForecast = asyncHandler(async (req, res, next) => {
  const { centerId } = req.query;
  if (!centerId) return next(new AppError('centerId is required.', HTTP.BAD_REQUEST));

  const center = await HealthCenter.findById(centerId);
  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));

  // Access checks
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== centerId) {
    return next(new AppError('Access denied. You can only query AI predictions for your own health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && center.district !== req.user.district) {
    return next(new AppError('Access denied. You can only query AI predictions for facilities in your district.', HTTP.FORBIDDEN));
  }

  const forecast = await aiService.demandForecast(centerId);
  return res.status(HTTP.OK).json(success(forecast, 'Demand forecast generated.'));
});

// ─── @route GET /api/v1/ai/predicted-stockouts ───────────────────────────────
exports.getPredictedStockouts = asyncHandler(async (req, res, next) => {
  const { centerId } = req.query;
  if (!centerId) return next(new AppError('centerId is required.', HTTP.BAD_REQUEST));

  const center = await HealthCenter.findById(centerId);
  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));

  // Access checks
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== centerId) {
    return next(new AppError('Access denied. You can only query AI predictions for your own health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && center.district !== req.user.district) {
    return next(new AppError('Access denied. You can only query AI predictions for facilities in your district.', HTTP.FORBIDDEN));
  }

  const stockouts = await aiService.predictStockouts(centerId);
  return res.status(HTTP.OK).json(success(stockouts, 'Stockout predictions generated.'));
});

// ─── @route GET /api/v1/ai/resource-optimization ─────────────────────────────
exports.getResourceOptimization = asyncHandler(async (req, res, next) => {
  const { centerId } = req.query;
  if (!centerId) return next(new AppError('centerId is required.', HTTP.BAD_REQUEST));

  const center = await HealthCenter.findById(centerId);
  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));

  // Access checks
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== centerId) {
    return next(new AppError('Access denied. You can only query AI predictions for your own health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && center.district !== req.user.district) {
    return next(new AppError('Access denied. You can only query AI predictions for facilities in your district.', HTTP.FORBIDDEN));
  }

  const recommendations = await aiService.resourceOptimization(centerId);
  return res.status(HTTP.OK).json(success(recommendations, 'Resource optimization analysis complete.'));
});

// ─── @route GET /api/v1/ai/underperforming-centers ───────────────────────────
exports.getUnderperformingCenters = asyncHandler(async (req, res, next) => {
  const { districtId, district } = req.query;
  let target = districtId || district;
  if (!target) return next(new AppError('districtId or district is required.', HTTP.BAD_REQUEST));

  // Access checks
  if (req.user.role === ROLES.STAFF) {
    return next(new AppError('Access denied. Staff cannot query district-wide performance analysis.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN) {
    target = req.user.district;
  }

  const results = await aiService.detectUnderperformingCenters(target);
  return res.status(HTTP.OK).json(success(results, 'Underperforming centres analysis complete.'));
});

// ─── @route GET /api/v1/ai/insights ──────────────────────────────────────────
exports.getAIInsights = asyncHandler(async (req, res, next) => {
  const { centerId } = req.query;
  if (!centerId) return next(new AppError('centerId is required.', HTTP.BAD_REQUEST));

  const center = await HealthCenter.findById(centerId);
  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));

  // Access checks
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== centerId) {
    return next(new AppError('Access denied. You can only query AI insights for your own health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && center.district !== req.user.district) {
    return next(new AppError('Access denied. You can only query AI insights for facilities in your district.', HTTP.FORBIDDEN));
  }

  const insights = await aiService.generateInsights(centerId);
  return res.status(HTTP.OK).json(success(insights, 'AI insights generated.'));
});

// ─── @route POST /api/v1/ai/chat ─────────────────────────────────────────────
exports.chatWithAI = asyncHandler(async (req, res, next) => {
  const { message, history } = req.body;
  if (!message) return next(new AppError('Message is required.', HTTP.BAD_REQUEST));

  const response = await aiService.chatWithAI(message, history, req.user);
  return res.status(HTTP.OK).json(success(response, 'AI response generated successfully.'));
});
