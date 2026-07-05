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

  if (!canViewAll && doctorId) {
    return next(new AppError('You cannot view other doctors attendance.', HTTP.FORBIDDEN));
  }

  const filterHealthCenter = canViewAll ? healthCenterId || req.query.healthCenter : req.user.healthCenter;
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

  if (!canViewAll && doctorId) {
    return next(new AppError('You cannot view other doctors attendance.', HTTP.FORBIDDEN));
  }

  const filterHealthCenter = canViewAll ? healthCenterId || req.query.healthCenter : req.user.healthCenter;
  const isSelfRole = [ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE].includes(req.user.role);
  const report = await getMonthlyAttendance({
    doctorId: doctorId || (isSelfRole ? req.user._id : null),
    healthCenterId: filterHealthCenter,
    month,
  });

  return res.status(HTTP.OK).json(success(report, 'Monthly attendance report retrieved.'));
});
