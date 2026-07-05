'use strict';

const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/pagination');
const { protect } = require('../middleware/auth');
const { mongoIdParam } = require('../middleware/validator');
const { HTTP } = require('../config/constants');

router.use(protect);

// GET /api/v1/notifications — get current user's notifications
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { unreadOnly } = req.query;

  const filter = { recipient: req.user._id };
  if (unreadOnly === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  return res.status(HTTP.OK).json({
    ...paginated(notifications, { page, limit, total }, 'Notifications retrieved.'),
    unreadCount,
  });
}));

// GET /api/v1/notifications/unread-count
router.get('/unread-count', asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  return res.status(HTTP.OK).json(success({ count }, 'Unread count retrieved.'));
}));

// PATCH /api/v1/notifications/:id/read — mark single notification as read
router.patch('/:id/read', mongoIdParam(), asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) return next(new AppError('Notification not found.', HTTP.NOT_FOUND));
  return res.status(HTTP.OK).json(success(notification, 'Notification marked as read.'));
}));

// PATCH /api/v1/notifications/mark-all-read — mark all as read
router.patch('/mark-all-read', asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return res.status(HTTP.OK).json(success({ modifiedCount: result.modifiedCount }, 'All notifications marked as read.'));
}));

// DELETE /api/v1/notifications/:id
router.delete('/:id', mongoIdParam(), asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  if (!notification) return next(new AppError('Notification not found.', HTTP.NOT_FOUND));
  return res.status(HTTP.OK).json(success(null, 'Notification deleted.'));
}));

// DELETE /api/v1/notifications — delete all read notifications
router.delete('/', asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({ recipient: req.user._id, isRead: true });
  return res.status(HTTP.OK).json(success({ deletedCount: result.deletedCount }, 'Read notifications deleted.'));
}));

module.exports = router;
