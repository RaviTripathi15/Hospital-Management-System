'use strict';

const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/apiResponse');
const aiService = require('../services/aiService');
const { HTTP, ROLES } = require('../config/constants');
const HealthCenter = require('../models/HealthCenter');
const Chat = require('../models/Chat');

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

// ─── @route GET /api/v1/ai/chats ─────────────────────────────────────────────
exports.getChats = asyncHandler(async (req, res, next) => {
  const query = { user: req.user._id };
  
  if (req.query.q) {
    query.title = { $regex: req.query.q, $options: 'i' };
  }

  const chats = await Chat.find(query)
    .sort({ isPinned: -1, updatedAt: -1 })
    .select('title isPinned createdAt updatedAt');

  return res.status(HTTP.OK).json(success(chats, 'Conversations retrieved successfully.'));
});

// ─── @route POST /api/v1/ai/chats ────────────────────────────────────────────
exports.createChat = asyncHandler(async (req, res, next) => {
  const { title, message } = req.body;

  let chat = new Chat({
    user: req.user._id,
    title: title || (message ? (message.trim().substring(0, 30) + (message.length > 30 ? '...' : '')) : 'New Conversation'),
    messages: []
  });

  if (message) {
    chat.messages.push({ sender: 'user', text: message });
    const aiResponse = await aiService.chatWithAI(message, [], req.user);
    chat.messages.push({ sender: 'ai', text: aiResponse.reply });
  }

  await chat.save();
  return res.status(HTTP.CREATED).json(success(chat, 'Conversation created successfully.'));
});

// ─── @route GET /api/v1/ai/chats/:id ─────────────────────────────────────────
exports.getChat = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
  if (!chat) return next(new AppError('Conversation not found.', HTTP.NOT_FOUND));

  return res.status(HTTP.OK).json(success(chat, 'Conversation retrieved successfully.'));
});

// ─── @route PUT /api/v1/ai/chats/:id ─────────────────────────────────────────
exports.updateChat = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
  if (!chat) return next(new AppError('Conversation not found.', HTTP.NOT_FOUND));

  const { title, isPinned } = req.body;
  if (title !== undefined) chat.title = title;
  if (isPinned !== undefined) chat.isPinned = isPinned;

  await chat.save();
  return res.status(HTTP.OK).json(success(chat, 'Conversation updated successfully.'));
});

// ─── @route DELETE /api/v1/ai/chats/:id ──────────────────────────────────────
exports.deleteChat = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!chat) return next(new AppError('Conversation not found.', HTTP.NOT_FOUND));

  return res.status(HTTP.OK).json(success(null, 'Conversation deleted successfully.'));
});

// ─── @route POST /api/v1/ai/chats/:id/messages ───────────────────────────────
exports.addChatMessage = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
  if (!chat) return next(new AppError('Conversation not found.', HTTP.NOT_FOUND));

  const { message } = req.body;
  if (!message) return next(new AppError('Message is required.', HTTP.BAD_REQUEST));

  // Add user message
  chat.messages.push({ sender: 'user', text: message });

  // Map messages to history format
  const history = chat.messages.slice(0, -1).map(msg => ({
    sender: msg.sender,
    text: msg.text
  }));

  // Generate response
  const aiResponse = await aiService.chatWithAI(message, history, req.user);

  // Add AI response
  chat.messages.push({ sender: 'ai', text: aiResponse.reply });

  // Auto rename if needed
  if (chat.title === 'New Conversation' && chat.messages.length <= 2) {
    const rawTitle = message.trim();
    chat.title = rawTitle.length > 30 ? rawTitle.substring(0, 30) + '...' : rawTitle;
  }

  await chat.save();

  return res.status(HTTP.OK).json(success({
    chat,
    reply: aiResponse.reply,
    timestamp: aiResponse.timestamp
  }, 'Message sent and reply generated.'));
});
