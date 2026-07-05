'use strict';

const Notification = require('../models/Notification');
const logger = require('../config/logger');

/**
 * Create a single notification.
 * @param {object} data - Notification data.
 * @returns {Promise<Notification>}
 */
const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    logger.info(`Notification created for user ${data.recipient}: [${data.type}] ${data.title}`);
    return notification;
  } catch (err) {
    logger.error(`Failed to create notification: ${err.message}`);
    throw err;
  }
};

/**
 * Send the same notification to multiple recipients.
 * @param {string[]} recipientIds - Array of User ObjectId strings.
 * @param {object} notificationData - Notification fields (without recipient).
 * @returns {Promise<Notification[]>}
 */
const sendBulkNotification = async (recipientIds, notificationData) => {
  if (!recipientIds || recipientIds.length === 0) return [];

  try {
    const docs = recipientIds.map((recipient) => ({ ...notificationData, recipient }));
    const created = await Notification.insertMany(docs, { ordered: false });
    logger.info(`Bulk notification sent to ${created.length} users: [${notificationData.type}] ${notificationData.title}`);
    return created;
  } catch (err) {
    logger.error(`Failed to send bulk notification: ${err.message}`);
    throw err;
  }
};

/**
 * Get unread notification count for a user.
 * @param {string} userId
 * @returns {Promise<number>}
 */
const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, isRead: false });
};

/**
 * Mark all notifications for a user as read.
 * @param {string} userId
 */
const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return result.modifiedCount;
};

/**
 * Delete notifications older than N days.
 * @param {number} days
 */
const cleanupOldNotifications = async (days = 90) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result = await Notification.deleteMany({
    createdAt: { $lt: cutoff },
    isRead: true,
  });

  logger.info(`Cleaned up ${result.deletedCount} old notifications.`);
  return result.deletedCount;
};

/**
 * Create a low-stock notification for a health centre's in-charge and district admin.
 */
const notifyLowStock = async ({ inChargeId, districtAdminIds = [], item, center }) => {
  const notifications = [];

  const base = {
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: `${item.itemName} at ${center.name} is at ${item.currentStock} ${item.unit} (min: ${item.minStockLevel}).`,
    relatedEntity: { model: 'Inventory', id: item._id },
    priority: item.currentStock === 0 ? 'critical' : 'high',
  };

  if (inChargeId) {
    notifications.push(createNotification({ ...base, recipient: inChargeId }));
  }

  if (districtAdminIds.length > 0 && item.currentStock === 0) {
    // Only notify district admins for zero-stock
    for (const adminId of districtAdminIds) {
      notifications.push(createNotification({ ...base, recipient: adminId }));
    }
  }

  await Promise.all(notifications);
};

module.exports = {
  createNotification,
  sendBulkNotification,
  getUnreadCount,
  markAllAsRead,
  cleanupOldNotifications,
  notifyLowStock,
};
