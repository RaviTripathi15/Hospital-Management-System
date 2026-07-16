'use strict';

const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Inventory = require('../models/Inventory');
const HealthCenter = require('../models/HealthCenter');
const Report = require('../models/Report');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/apiResponse');
const { HTTP, ROLES, APPOINTMENT_STATUS } = require('../config/constants');

// Helper: get tenant-scoped center filter for analytics
const getAnalyticsCenterFilter = async (req) => {
  if (req.user.role === ROLES.STAFF || [ROLES.DOCTOR, ROLES.NURSE].includes(req.user.role)) {
    const userCenter = req.user.healthCenter ? req.user.healthCenter.toString() : null;
    return { healthCenter: userCenter ? new (require('mongoose').Types.ObjectId)(userCenter) : null };
  } else if (req.user.role === ROLES.DISTRICT_ADMIN) {
    const centers = await HealthCenter.find({ district: req.user.district, isActive: true }).select('_id');
    const centerIds = centers.map((c) => c._id);
    if (req.query.centerId) {
      if (!centerIds.map((id) => id.toString()).includes(req.query.centerId.toString())) {
        throw new AppError('Access denied. Facility is not in your district.', HTTP.FORBIDDEN);
      }
      return { healthCenter: new (require('mongoose').Types.ObjectId)(req.query.centerId) };
    } else {
      return { healthCenter: { $in: centerIds.map((id) => new (require('mongoose').Types.ObjectId)(id)) } };
    }
  } else if (req.user.role === ROLES.SUPER_ADMIN) {
    if (req.query.centerId) {
      return { healthCenter: new (require('mongoose').Types.ObjectId)(req.query.centerId) };
    }
    return {};
  } else {
    throw new AppError('Access denied.', HTTP.FORBIDDEN);
  }
};

// ─── @route GET /api/v1/analytics/dashboard ──────────────────────────────────
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const centerFilter = await getAnalyticsCenterFilter(req);

  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalPatients,
    newPatientsThisMonth,
    newPatientsLastMonth,
    todayAppts,
    completedThisMonth,
    pendingAppts,
    lowStockCount,
    expiredCount,
    totalStaff,
    pendingReports,
  ] = await Promise.all([
    Patient.countDocuments({ ...centerFilter, isActive: true }),
    Patient.countDocuments({ ...centerFilter, createdAt: { $gte: startOfMonth } }),
    Patient.countDocuments({ ...centerFilter, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    Appointment.countDocuments({ ...centerFilter, date: { $gte: startOfToday } }),
    Appointment.countDocuments({ ...centerFilter, status: APPOINTMENT_STATUS.COMPLETED, date: { $gte: startOfMonth } }),
    Appointment.countDocuments({ ...centerFilter, status: APPOINTMENT_STATUS.SCHEDULED, date: { $gte: new Date() } }),
    Inventory.countDocuments({ ...centerFilter, isActive: true, $expr: { $lte: ['$currentStock', '$minStockLevel'] } }),
    Inventory.countDocuments({ ...centerFilter, isActive: true, expiryDate: { $lt: new Date() }, currentStock: { $gt: 0 } }),
    User.countDocuments({ ...centerFilter, isActive: true }),
    Report.countDocuments({ ...centerFilter, status: 'submitted' }),
  ]);

  const patientGrowth = newPatientsLastMonth > 0
    ? (((newPatientsThisMonth - newPatientsLastMonth) / newPatientsLastMonth) * 100).toFixed(1)
    : null;

  return res.status(HTTP.OK).json(
    success(
      {
        patients: { total: totalPatients, newThisMonth: newPatientsThisMonth, growthPercent: patientGrowth },
        appointments: { today: todayAppts, completedThisMonth, pending: pendingAppts },
        inventory: { lowStock: lowStockCount, expired: expiredCount },
        staff: { total: totalStaff },
        reports: { pendingApproval: pendingReports },
      },
      'Dashboard stats retrieved.'
    )
  );
});

// ─── @route GET /api/v1/analytics/district ───────────────────────────────────
exports.getDistrictStats = asyncHandler(async (req, res, next) => {
  let district = req.user.district;
  if (req.user.role === ROLES.SUPER_ADMIN && req.query.district) {
    district = req.query.district;
  } else if (req.user.role !== ROLES.SUPER_ADMIN && req.user.role !== ROLES.DISTRICT_ADMIN) {
    return next(new AppError('Access denied.', HTTP.FORBIDDEN));
  }

  if (!district) return next(new AppError('District is required.', HTTP.BAD_REQUEST));

  const centers = await HealthCenter.find({ district, isActive: true }).select('_id name type');
  const centerIds = centers.map((c) => c._id);

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [totalPatients, appointmentsThisMonth, lowStockItems, centerCount] = await Promise.all([
    Patient.countDocuments({ healthCenter: { $in: centerIds }, isActive: true }),
    Appointment.countDocuments({ healthCenter: { $in: centerIds }, createdAt: { $gte: startOfMonth } }),
    Inventory.countDocuments({
      healthCenter: { $in: centerIds },
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
    }),
    HealthCenter.countDocuments({ district, isActive: true }),
  ]);

  // Per-centre breakdown
  const centerStats = await Promise.all(
    centers.map(async (c) => {
      const [patients, appts] = await Promise.all([
        Patient.countDocuments({ healthCenter: c._id, isActive: true }),
        Appointment.countDocuments({ healthCenter: c._id, createdAt: { $gte: startOfMonth } }),
      ]);
      return { centerId: c._id, name: c.name, type: c.type, patients, appointmentsThisMonth: appts };
    })
  );

  return res.status(HTTP.OK).json(
    success(
      { district, centerCount, totalPatients, appointmentsThisMonth, lowStockItems, centerBreakdown: centerStats },
      'District stats retrieved.'
    )
  );
});

// ─── @route GET /api/v1/analytics/national ───────────────────────────────────
exports.getNationalStats = asyncHandler(async (req, res, next) => {
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new AppError('Access denied. National statistics are only accessible to super administrators.', HTTP.FORBIDDEN));
  }

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [
    totalCenters,
    activeCenters,
    totalPatients,
    appointmentsThisMonth,
    lowStockTotal,
    totalUsers,
  ] = await Promise.all([
    HealthCenter.countDocuments(),
    HealthCenter.countDocuments({ operationalStatus: 'active', isActive: true }),
    Patient.countDocuments({ isActive: true }),
    Appointment.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Inventory.countDocuments({ isActive: true, $expr: { $lte: ['$currentStock', '$minStockLevel'] } }),
    User.countDocuments({ isActive: true }),
  ]);

  // District-wise patient aggregation
  const districtBreakdown = await Patient.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'healthcenters',
        localField: 'healthCenter',
        foreignField: '_id',
        as: 'center',
      },
    },
    { $unwind: '$center' },
    { $group: { _id: '$center.district', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  return res.status(HTTP.OK).json(
    success(
      {
        centers: { total: totalCenters, active: activeCenters },
        patients: { total: totalPatients },
        appointments: { thisMonth: appointmentsThisMonth },
        inventory: { lowStock: lowStockTotal },
        users: { total: totalUsers },
        districtBreakdown,
      },
      'National stats retrieved.'
    )
  );
});

// ─── @route GET /api/v1/analytics/inventory ──────────────────────────────────
exports.getInventoryAnalytics = asyncHandler(async (req, res) => {
  const centerFilter = await getAnalyticsCenterFilter(req);
  const matchStage = { $match: { ...centerFilter, isActive: true } };

  const [categoryBreakdown, expiryBreakdown, stockStatus] = await Promise.all([
    Inventory.aggregate([
      matchStage,
      { $group: { _id: '$category', totalItems: { $sum: 1 }, totalStock: { $sum: '$currentStock' }, totalValue: { $sum: { $multiply: ['$currentStock', '$unitCost'] } } } },
      { $sort: { totalItems: -1 } },
    ]),
    Inventory.aggregate([
      matchStage,
      { $match: { expiryDate: { $ne: null } } },
      {
        $addFields: {
          daysUntilExpiry: {
            $divide: [{ $subtract: ['$expiryDate', new Date()] }, 86400000],
          },
        },
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$daysUntilExpiry', 0] }, then: 'expired' },
                { case: { $lte: ['$daysUntilExpiry', 30] }, then: 'expiring_soon' },
                { case: { $lte: ['$daysUntilExpiry', 90] }, then: 'expiring_3months' },
              ],
              default: 'good',
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Inventory.aggregate([
      matchStage,
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          outOfStock: { $sum: { $cond: [{ $eq: ['$currentStock', 0] }, 1, 0] } },
          lowStock: { $sum: { $cond: [{ $lte: ['$currentStock', '$minStockLevel'] }, 1, 0] } },
          adequateStock: { $sum: { $cond: [{ $gt: ['$currentStock', '$minStockLevel'] }, 1, 0] } },
          totalValue: { $sum: { $multiply: ['$currentStock', '$unitCost'] } },
        },
      },
    ]),
  ]);

  return res.status(HTTP.OK).json(
    success({ categoryBreakdown, expiryBreakdown, stockStatus: stockStatus[0] || {} }, 'Inventory analytics retrieved.')
  );
});

// ─── @route GET /api/v1/analytics/appointment-trends ─────────────────────────
exports.getAppointmentTrends = asyncHandler(async (req, res) => {
  const centerFilter = await getAnalyticsCenterFilter(req);
  const days = parseInt(req.query.days, 10) || 30;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const matchStage = {
    $match: {
      date: { $gte: startDate },
      ...centerFilter,
    },
  };

  const [dailyTrend, statusBreakdown, typeBreakdown] = await Promise.all([
    Appointment.aggregate([
      matchStage,
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Appointment.aggregate([
      matchStage,
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Appointment.aggregate([
      matchStage,
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
  ]);

  return res.status(HTTP.OK).json(
    success({ dailyTrend, statusBreakdown, typeBreakdown }, 'Appointment trends retrieved.')
  );
});

// ─── @route GET /api/v1/analytics/patient-demographics ───────────────────────
exports.getPatientDemographics = asyncHandler(async (req, res) => {
  const centerFilter = await getAnalyticsCenterFilter(req);
  const matchStage = { $match: { ...centerFilter, isActive: true } };

  const [genderDist, ageGroups, bloodGroupDist, monthlyRegistrations] = await Promise.all([
    Patient.aggregate([
      matchStage,
      { $group: { _id: '$gender', count: { $sum: 1 } } },
    ]),
    Patient.aggregate([
      matchStage,
      {
        $addFields: {
          computedAge: {
            $cond: {
              if: { $ne: ['$dob', null] },
              then: { $divide: [{ $subtract: [new Date(), '$dob'] }, 31536000000] },
              else: '$age',
            },
          },
        },
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$computedAge', 5] }, then: '0-4' },
                { case: { $lt: ['$computedAge', 18] }, then: '5-17' },
                { case: { $lt: ['$computedAge', 40] }, then: '18-39' },
                { case: { $lt: ['$computedAge', 60] }, then: '40-59' },
              ],
              default: '60+',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Patient.aggregate([
      matchStage,
      { $match: { bloodGroup: { $ne: null } } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Patient.aggregate([
      matchStage,
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]),
  ]);

  return res.status(HTTP.OK).json(
    success({ genderDist, ageGroups, bloodGroupDist, monthlyRegistrations }, 'Patient demographics retrieved.')
  );
});
