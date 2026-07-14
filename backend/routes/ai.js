'use strict';

const express = require('express');
const router = express.Router();

const {
  getDemandForecast, getPredictedStockouts, getResourceOptimization,
  getUnderperformingCenters, getAIInsights, chatWithAI,
} = require('../controllers/aiController');

const { protect, requireMinRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { analyticsLimiter } = require('../middleware/rateLimiter');

router.use(protect, analyticsLimiter);

router.post('/chat', chatWithAI);
router.get('/demand-forecast', requireMinRole(ROLES.STAFF), getDemandForecast);
router.get('/predicted-stockouts', requireMinRole(ROLES.STAFF), getPredictedStockouts);
router.get('/resource-optimization', requireMinRole(ROLES.DISTRICT_ADMIN), getResourceOptimization);
router.get('/underperforming-centers', requireMinRole(ROLES.DISTRICT_ADMIN), getUnderperformingCenters);
router.get('/insights', requireMinRole(ROLES.STAFF), getAIInsights);

module.exports = router;
