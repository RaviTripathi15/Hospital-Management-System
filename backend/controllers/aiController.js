'use strict';

const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/apiResponse');
const aiService = require('../services/aiService');
const { HTTP } = require('../config/constants');

// ─── @route GET /api/v1/ai/demand-forecast ───────────────────────────────────
exports.getDemandForecast = asyncHandler(async (req, res, next) => {
  const { centerId } = req.query;
  if (!centerId) return next(new AppError('centerId is required.', HTTP.BAD_REQUEST));

  const forecast = await aiService.demandForecast(centerId);
  return res.status(HTTP.OK).json(success(forecast, 'Demand forecast generated.'));
});

// ─── @route GET /api/v1/ai/predicted-stockouts ───────────────────────────────
exports.getPredictedStockouts = asyncHandler(async (req, res, next) => {
  const { centerId } = req.query;
  if (!centerId) return next(new AppError('centerId is required.', HTTP.BAD_REQUEST));

  const stockouts = await aiService.predictStockouts(centerId);
  return res.status(HTTP.OK).json(success(stockouts, 'Stockout predictions generated.'));
});

// ─── @route GET /api/v1/ai/resource-optimization ─────────────────────────────
exports.getResourceOptimization = asyncHandler(async (req, res, next) => {
  const { centerId } = req.query;
  if (!centerId) return next(new AppError('centerId is required.', HTTP.BAD_REQUEST));

  const recommendations = await aiService.resourceOptimization(centerId);
  return res.status(HTTP.OK).json(success(recommendations, 'Resource optimization analysis complete.'));
});

// ─── @route GET /api/v1/ai/underperforming-centers ───────────────────────────
exports.getUnderperformingCenters = asyncHandler(async (req, res, next) => {
  const { districtId, district } = req.query;
  const target = districtId || district;
  if (!target) return next(new AppError('districtId or district is required.', HTTP.BAD_REQUEST));

  const results = await aiService.detectUnderperformingCenters(target);
  return res.status(HTTP.OK).json(success(results, 'Underperforming centres analysis complete.'));
});

// ─── @route GET /api/v1/ai/insights ──────────────────────────────────────────
exports.getAIInsights = asyncHandler(async (req, res, next) => {
  const { centerId } = req.query;
  if (!centerId) return next(new AppError('centerId is required.', HTTP.BAD_REQUEST));

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
