'use strict';

const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/apiResponse');
const { HTTP, ROLES } = require('../config/constants');
const {
  getTodayAttendance,
  upsertDailyAttendance,
  getAttendanceRecords,
  getMonthlyAttendance,
} = require('../services/attendanceService');

exports.markAttendance = asyncHandler(async (req, res, next) => {
  const { healthCenter, loginTime, logoutTime, status, notes } = req.body;

  if (!healthCenter) {
    return next(new AppError('Health center is required.', HTTP.BAD_REQUEST));
  }

  // Access checks
  if ([ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE].includes(req.user.role)) {
    if (req.user.healthCenter?.toString() !== healthCenter.toString()) {
      return next(new AppError('You can only mark attendance at your assigned health centre.', HTTP.FORBIDDEN));
    }
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN) {
    const HealthCenter = require('../models/HealthCenter');
    const center = await HealthCenter.findById(healthCenter);
    if (!center || center.district !== req.user.district) {
      return next(new AppError('You can only mark attendance in your district.', HTTP.FORBIDDEN));
    }
  }

  const record = await upsertDailyAttendance({
    doctorId: req.user._id,
    healthCenterId: healthCenter,
    loginTime,
    logoutTime,
    status,
    notes,
  });

  return res.status(HTTP.CREATED).json(success(record, 'Attendance marked successfully.'));
});

exports.getMyAttendance = asyncHandler(async (req, res) => {
  const record = await getTodayAttendance(req.user._id, req.user.healthCenter);
  return res.status(HTTP.OK).json(success(record, 'Today attendance fetched.'));
});

exports.getAttendanceRecords = asyncHandler(async (req, res, next) => {
  const { doctorId, healthCenterId, startDate, endDate } = req.query;
  const canViewAll = [ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN].includes(req.user.role);

  if (!canViewAll && doctorId && doctorId !== req.user._id.toString()) {
    return next(new AppError('You cannot view other doctors attendance.', HTTP.FORBIDDEN));
  }

  let filterHealthCenter = canViewAll ? healthCenterId || req.query.healthCenter : req.user.healthCenter;

  if (req.user.role === ROLES.DISTRICT_ADMIN) {
    const HealthCenter = require('../models/HealthCenter');
    const centers = await HealthCenter.find({ district: req.user.district, isActive: true }).select('_id');
    const centerIds = centers.map((c) => c._id);
    if (filterHealthCenter) {
      if (!centerIds.map((id) => id.toString()).includes(filterHealthCenter.toString())) {
        return next(new AppError('Access denied. Facility is not in your district.', HTTP.FORBIDDEN));
      }
    } else {
      filterHealthCenter = { $in: centerIds };
    }
  }

  const isSelfRole = [ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE].includes(req.user.role);
  const records = await getAttendanceRecords({
    doctorId: doctorId || (isSelfRole ? req.user._id : null),
    healthCenterId: filterHealthCenter,
    startDate,
    endDate,
  });

  return res.status(HTTP.OK).json(success(records, 'Attendance records retrieved.'));
});

exports.getMonthlyReport = asyncHandler(async (req, res, next) => {
  const { doctorId, healthCenterId, month } = req.query;
  const canViewAll = [ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN].includes(req.user.role);

  if (!canViewAll && doctorId && doctorId !== req.user._id.toString()) {
    return next(new AppError('You cannot view other doctors attendance.', HTTP.FORBIDDEN));
  }

  let filterHealthCenter = canViewAll ? healthCenterId || req.query.healthCenter : req.user.healthCenter;

  if (req.user.role === ROLES.DISTRICT_ADMIN) {
    const HealthCenter = require('../models/HealthCenter');
    const centers = await HealthCenter.find({ district: req.user.district, isActive: true }).select('_id');
    const centerIds = centers.map((c) => c._id);
    if (filterHealthCenter) {
      if (!centerIds.map((id) => id.toString()).includes(filterHealthCenter.toString())) {
        return next(new AppError('Access denied. Facility is not in your district.', HTTP.FORBIDDEN));
      }
    } else {
      filterHealthCenter = { $in: centerIds };
    }
  }

  const isSelfRole = [ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE].includes(req.user.role);
  const report = await getMonthlyAttendance({
    doctorId: doctorId || (isSelfRole ? req.user._id : null),
    healthCenterId: filterHealthCenter,
    month,
  });

  return res.status(HTTP.OK).json(success(report, 'Monthly attendance report retrieved.'));
});
