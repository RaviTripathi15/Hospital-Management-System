'use strict';

const cron = require('node-cron');
const logger = require('../config/logger');
const { generateDailyReport, generateWeeklyReport } = require('../services/reportService');
const { cleanupOldNotifications } = require('../services/notificationService');
const Inventory = require('../models/Inventory');
const HealthCenter = require('../models/HealthCenter');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { NOTIFICATION_TYPES, THRESHOLDS } = require('../config/constants');

/**
 * Daily Stock Check — runs every day at 6:00 AM.
 * Checks all active inventory items and sends low-stock / expiry notifications.
 */
const dailyStockCheck = cron.schedule('0 6 * * *', async () => {
  logger.info('[CronJob] Starting daily stock check...');

  try {
    const expiryAlertDate = new Date();
    expiryAlertDate.setDate(expiryAlertDate.getDate() + THRESHOLDS.EXPIRY_ALERT_DAYS);

    // Find all low-stock items
    const lowStockItems = await Inventory.find({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
    }).populate('healthCenter', '_id name inCharge district');

    // Group by centre
    const byCenter = {};
    lowStockItems.forEach((item) => {
      const cId = item.healthCenter._id.toString();
      if (!byCenter[cId]) {
        byCenter[cId] = { center: item.healthCenter, items: [] };
      }
      byCenter[cId].items.push(item);
    });

    // Send notifications per centre
    for (const cId of Object.keys(byCenter)) {
      const { center, items } = byCenter[cId];
      if (center.inCharge) {
        await createNotification({
          recipient: center.inCharge,
          type: NOTIFICATION_TYPES.LOW_STOCK,
          title: `Low Stock Alert — ${center.name}`,
          message: `${items.length} item(s) are at or below minimum stock levels.`,
          priority: items.some((i) => i.currentStock === 0) ? 'critical' : 'high',
        });
      }
    }

    // Find expiring items
    const expiringItems = await Inventory.find({
      isActive: true,
      currentStock: { $gt: 0 },
      expiryDate: { $lte: expiryAlertDate, $gte: new Date() },
    }).populate('healthCenter', '_id name inCharge');

    const byCenter2 = {};
    expiringItems.forEach((item) => {
      const cId = item.healthCenter._id.toString();
      if (!byCenter2[cId]) {
        byCenter2[cId] = { center: item.healthCenter, items: [] };
      }
      byCenter2[cId].items.push(item);
    });

    for (const cId of Object.keys(byCenter2)) {
      const { center, items } = byCenter2[cId];
      if (center.inCharge) {
        const criticalItems = items.filter((i) => {
          const days = Math.ceil((new Date(i.expiryDate) - new Date()) / 86400000);
          return days <= 30;
        });

        if (criticalItems.length > 0) {
          await createNotification({
            recipient: center.inCharge,
            type: NOTIFICATION_TYPES.EXPIRY_ALERT,
            title: `Expiry Alert — ${center.name}`,
            message: `${criticalItems.length} item(s) expire within 30 days.`,
            priority: 'high',
          });
        }
      }
    }

    logger.info(`[CronJob] Daily stock check complete. Low-stock: ${lowStockItems.length}, Expiring: ${expiringItems.length}`);
  } catch (err) {
    logger.error(`[CronJob] Daily stock check failed: ${err.message}`);
  }
}, { scheduled: false });

/**
 * Generate daily reports for all active centres — runs every day at 1:00 AM.
 */
const dailyReportGeneration = cron.schedule('0 1 * * *', async () => {
  logger.info('[CronJob] Starting daily report generation...');

  try {
    const centers = await HealthCenter.find({ isActive: true, operationalStatus: 'active' }).select('_id name');
    let generated = 0;
    let errors = 0;

    for (const center of centers) {
      try {
        await generateDailyReport(center._id.toString());
        generated++;
      } catch (err) {
        logger.error(`[CronJob] Failed to generate daily report for ${center.name}: ${err.message}`);
        errors++;
      }
    }

    logger.info(`[CronJob] Daily report generation complete. Generated: ${generated}, Errors: ${errors}`);
  } catch (err) {
    logger.error(`[CronJob] Daily report generation job failed: ${err.message}`);
  }
}, { scheduled: false });

/**
 * Weekly report generation — runs every Monday at 2:00 AM.
 */
const weeklyReportGeneration = cron.schedule('0 2 * * 1', async () => {
  logger.info('[CronJob] Starting weekly report generation...');

  try {
    const centers = await HealthCenter.find({ isActive: true }).select('_id name');
    let generated = 0;

    for (const center of centers) {
      try {
        await generateWeeklyReport(center._id.toString());
        generated++;
      } catch (err) {
        logger.error(`[CronJob] Weekly report failed for ${center.name}: ${err.message}`);
      }
    }

    logger.info(`[CronJob] Weekly reports generated: ${generated}`);
  } catch (err) {
    logger.error(`[CronJob] Weekly report job failed: ${err.message}`);
  }
}, { scheduled: false });

/**
 * Monthly analytics summary — runs on the 1st of every month at 3:00 AM.
 */
const monthlyAnalytics = cron.schedule('0 3 1 * *', async () => {
  logger.info('[CronJob] Starting monthly analytics...');

  try {
    const { generateMonthlyReportsForDistrict } = require('../services/reportService');
    const { DISTRICTS } = require('../config/constants');

    for (const district of DISTRICTS) {
      try {
        await generateMonthlyReportsForDistrict(district);
      } catch (err) {
        logger.error(`[CronJob] Monthly report failed for district ${district}: ${err.message}`);
      }
    }

    logger.info('[CronJob] Monthly analytics complete.');
  } catch (err) {
    logger.error(`[CronJob] Monthly analytics job failed: ${err.message}`);
  }
}, { scheduled: false });

/**
 * Expired inventory check — runs every day at 7:00 AM.
 * Marks expired items and notifies centre in-charge.
 */
const expiredInventoryCheck = cron.schedule('0 7 * * *', async () => {
  logger.info('[CronJob] Starting expired inventory check...');

  try {
    const now = new Date();

    const expiredItems = await Inventory.find({
      isActive: true,
      currentStock: { $gt: 0 },
      expiryDate: { $lt: now },
    }).populate('healthCenter', '_id name inCharge');

    const notified = new Set();

    for (const item of expiredItems) {
      const centerId = item.healthCenter._id.toString();
      if (!notified.has(centerId) && item.healthCenter.inCharge) {
        await createNotification({
          recipient: item.healthCenter.inCharge,
          type: NOTIFICATION_TYPES.EXPIRY_ALERT,
          title: `Expired Items Found — ${item.healthCenter.name}`,
          message: `There are expired items in your inventory. Please conduct a stock audit.`,
          priority: 'critical',
        });
        notified.add(centerId);
      }
    }

    logger.info(`[CronJob] Expired inventory check: found ${expiredItems.length} items across ${notified.size} centres.`);
  } catch (err) {
    logger.error(`[CronJob] Expired inventory check failed: ${err.message}`);
  }
}, { scheduled: false });

/**
 * Notification cleanup — runs every Sunday at midnight.
 * Removes read notifications older than 90 days.
 */
const notificationCleanup = cron.schedule('0 0 * * 0', async () => {
  logger.info('[CronJob] Starting notification cleanup...');
  try {
    const deleted = await cleanupOldNotifications(90);
    logger.info(`[CronJob] Notification cleanup: deleted ${deleted} old notifications.`);
  } catch (err) {
    logger.error(`[CronJob] Notification cleanup failed: ${err.message}`);
  }
}, { scheduled: false });

/**
 * Report submission reminders — runs every day at 9:00 AM.
 * Reminds staff to submit pending reports.
 */
const reportReminders = cron.schedule('0 9 * * *', async () => {
  logger.info('[CronJob] Sending report submission reminders...');

  try {
    const Report = require('../models/Report');
    const { REPORT_STATUS } = require('../config/constants');

    // Find draft reports older than 2 days
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const overdueReports = await Report.find({
      status: REPORT_STATUS.DRAFT,
      createdAt: { $lt: twoDaysAgo },
    }).populate('healthCenter', '_id name inCharge district');

    for (const report of overdueReports) {
      if (report.healthCenter?.inCharge) {
        await createNotification({
          recipient: report.healthCenter.inCharge,
          type: NOTIFICATION_TYPES.REPORT_DUE,
          title: 'Report Pending Submission',
          message: `Your ${report.reportType} report for ${report.healthCenter.name} is still in draft. Please submit it.`,
          relatedEntity: { model: 'Report', id: report._id },
          priority: 'medium',
        });
      }
    }

    logger.info(`[CronJob] Report reminders sent for ${overdueReports.length} overdue reports.`);
  } catch (err) {
    logger.error(`[CronJob] Report reminders job failed: ${err.message}`);
  }
}, { scheduled: false });

/**
 * Daily Usage Deduction — runs every day at midnight.
 * Subtracts dailyUsage from currentStock for all items.
 */
const dailyUsageDeduction = cron.schedule('0 0 * * *', async () => {
  logger.info('[CronJob] Starting daily usage deduction...');

  try {
    const items = await Inventory.find({
      isActive: true,
      dailyUsage: { $gt: 0 },
      currentStock: { $gt: 0 },
    }).populate('healthCenter', '_id name inCharge');

    let updatedCount = 0;

    for (const item of items) {
      const deduction = Math.min(item.currentStock, item.dailyUsage);
      if (deduction > 0) {
        const newStock = item.currentStock - deduction;
        item.currentStock = newStock;
        
        // Log subtraction history
        item.restockHistory.push({
          quantity: deduction,
          operation: 'subtract',
          notes: 'Daily usage deduction (automated)',
          stockAfter: newStock,
        });

        await item.save();
        updatedCount++;

        // Trigger low stock notifications if applicable
        if (newStock <= item.minStockLevel && item.healthCenter?.inCharge) {
          await createNotification({
            recipient: item.healthCenter.inCharge,
            type: NOTIFICATION_TYPES.LOW_STOCK,
            title: `Low Stock Alert — ${item.healthCenter.name}`,
            message: `Automated usage: ${item.itemName} has dropped to low stock (${newStock} ${item.unit}).`,
            relatedEntity: { model: 'Inventory', id: item._id },
            priority: newStock === 0 ? 'critical' : 'high',
          });
        }
      }
    }

    logger.info(`[CronJob] Daily usage deduction complete. Updated ${updatedCount} items.`);
  } catch (err) {
    logger.error(`[CronJob] Daily usage deduction failed: ${err.message}`);
  }
}, { scheduled: false });

/**
 * Initialize and start all cron jobs.
 */
const initCronJobs = () => {
  if (process.env.NODE_ENV === 'test') {
    logger.info('Cron jobs disabled in test environment.');
    return;
  }

  dailyStockCheck.start();
  dailyReportGeneration.start();
  weeklyReportGeneration.start();
  monthlyAnalytics.start();
  expiredInventoryCheck.start();
  notificationCleanup.start();
  reportReminders.start();
  dailyUsageDeduction.start();

  logger.info('All cron jobs initialized and running.');
};

module.exports = {
  initCronJobs,
  dailyStockCheck,
  dailyReportGeneration,
  weeklyReportGeneration,
  monthlyAnalytics,
  expiredInventoryCheck,
  notificationCleanup,
  reportReminders,
  dailyUsageDeduction,
};
