'use strict';

const express = require('express');
const router = express.Router();

const {
  getDemandForecast, getPredictedStockouts, getResourceOptimization,
  getUnderperformingCenters, getAIInsights, chatWithAI,
  getChats, createChat, getChat, updateChat, deleteChat, addChatMessage,
} = require('../controllers/aiController');

const { protect, requireMinRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { analyticsLimiter } = require('../middleware/rateLimiter');

router.use(protect, analyticsLimiter);

router.post('/chat', chatWithAI);

// AI Chatbot history persistence routes
router.get('/chats', getChats);
router.post('/chats', createChat);
router.get('/chats/:id', getChat);
router.put('/chats/:id', updateChat);
router.delete('/chats/:id', deleteChat);
router.post('/chats/:id/messages', addChatMessage);

router.get('/demand-forecast', requireMinRole(ROLES.STAFF), getDemandForecast);
router.get('/predicted-stockouts', requireMinRole(ROLES.STAFF), getPredictedStockouts);
router.get('/resource-optimization', requireMinRole(ROLES.DISTRICT_ADMIN), getResourceOptimization);
router.get('/underperforming-centers', requireMinRole(ROLES.DISTRICT_ADMIN), getUnderperformingCenters);
router.get('/insights', requireMinRole(ROLES.STAFF), getAIInsights);

module.exports = router;
