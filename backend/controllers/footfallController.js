'use strict';

const Footfall = require('../models/Footfall');
const HealthCenter = require('../models/HealthCenter');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/apiResponse');
const { HTTP, ROLES } = require('../config/constants');
const mongoose = require('mongoose');

// ─── @route POST /api/v1/footfall ─────────────────────────────────────────────
exports.logFootfall = asyncHandler(async (req, res, next) => {
  const { healthCenter, patientCount, department, timestamp } = req.body;

  const center = await HealthCenter.findById(healthCenter);
  if (!center) return next(new AppError('Health center not found.', HTTP.NOT_FOUND));

  // Only staff of the center or district/super admin can log footfall
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== healthCenter) {
    return next(new AppError('You are not authorized to log footfall for this facility.', HTTP.FORBIDDEN));
  }

  const footfall = await Footfall.create({
    healthCenter,
    patientCount: Number(patientCount),
    department,
    timestamp: timestamp ? new Date(timestamp) : new Date(),
  });

  return res.status(HTTP.CREATED).json(success(footfall, 'Footfall log recorded successfully.'));
});

// ─── @route GET /api/v1/footfall/stats ────────────────────────────────────────
exports.getFootfallStats = asyncHandler(async (req, res, next) => {
  const centerId = req.query.healthCenter || (req.user.healthCenter ? req.user.healthCenter.toString() : null);
  if (!centerId) {
    return next(new AppError('Health center ID is required.', HTTP.BAD_REQUEST));
  }

  const centerObjId = new mongoose.Types.ObjectId(centerId);

  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [dailyTotal, monthlyTotal, departmentBreakdown] = await Promise.all([
    // Daily count
    Footfall.aggregate([
      { $match: { healthCenter: centerObjId, timestamp: { $gte: startOfToday } } },
      { $group: { _id: null, count: { $sum: '$patientCount' } } },
    ]),
    // Monthly count
    Footfall.aggregate([
      { $match: { healthCenter: centerObjId, timestamp: { $gte: startOfMonth } } },
      { $group: { _id: null, count: { $sum: '$patientCount' } } },
    ]),
    // Department breakdown
    Footfall.aggregate([
      { $match: { healthCenter: centerObjId } },
      { $group: { _id: '$department', count: { $sum: '$patientCount' } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return res.status(HTTP.OK).json(
    success(
      {
        dailyCount: dailyTotal[0]?.count || 0,
        monthlyCount: monthlyTotal[0]?.count || 0,
        departmentBreakdown: departmentBreakdown.map((d) => ({
          department: d._id,
          count: d.count,
        })),
      },
      'Footfall statistics retrieved.'
    )
  );
});

// ─── @route GET /api/v1/footfall/peak-hours ───────────────────────────────────
exports.getPeakHours = asyncHandler(async (req, res, next) => {
  const centerId = req.query.healthCenter || (req.user.healthCenter ? req.user.healthCenter.toString() : null);
  if (!centerId) {
    return next(new AppError('Health center ID is required.', HTTP.BAD_REQUEST));
  }

  const centerObjId = new mongoose.Types.ObjectId(centerId);

  const peakHours = await Footfall.aggregate([
    { $match: { healthCenter: centerObjId } },
    {
      $project: {
        hour: { $hour: { date: '$timestamp', timezone: 'Asia/Kolkata' } },
        patientCount: 1,
      },
    },
    {
      $group: {
        _id: '$hour',
        count: { $sum: '$patientCount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Format response to ensure all hours (0-23) are represented, default to 0 count
  const hoursMap = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  peakHours.forEach((ph) => {
    if (ph._id >= 0 && ph._id < 24) {
      hoursMap[ph._id].count = ph.count;
    }
  });

  return res.status(HTTP.OK).json(success(hoursMap, 'Peak hour distributions retrieved.'));
});

// ─── @route GET /api/v1/footfall/trends ───────────────────────────────────────
exports.getTrends = asyncHandler(async (req, res, next) => {
  const centerId = req.query.healthCenter || (req.user.healthCenter ? req.user.healthCenter.toString() : null);
  if (!centerId) {
    return next(new AppError('Health center ID is required.', HTTP.BAD_REQUEST));
  }

  const days = parseInt(req.query.days, 10) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const centerObjId = new mongoose.Types.ObjectId(centerId);

  const trends = await Footfall.aggregate([
    { $match: { healthCenter: centerObjId, timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: 'Asia/Kolkata' } },
        count: { $sum: '$patientCount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const formattedTrends = trends.map((t) => ({
    date: t._id,
    count: t.count,
  }));

  return res.status(HTTP.OK).json(success(formattedTrends, 'Footfall trends retrieved.'));
});
