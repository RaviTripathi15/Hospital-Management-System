'use strict';

const Attendance = require('../models/Attendance');
const User = require('../models/User');
const HealthCenter = require('../models/HealthCenter');
const { AppError } = require('../middleware/errorHandler');
const { HTTP, ROLES } = require('../config/constants');

const WORK_START_HOUR = 9;
const LATE_THRESHOLD_HOUR = 9;

const normalizeDate = (value) => {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const determineAttendanceStatus = (loginTime) => {
  const hour = new Date(loginTime).getHours();
  if (hour >= LATE_THRESHOLD_HOUR) return 'late';
  return 'present';
};

const buildMonthlySummary = (records = []) => {
  const presentDays = records.filter((entry) => entry.status === 'present').length;
  const lateDays = records.filter((entry) => entry.status === 'late').length;
  const absentDays = records.filter((entry) => entry.status === 'absent').length;
  const totalDays = records.length || 1;

  return {
    presentDays,
    lateDays,
    absentDays,
    attendanceRate: Number((((presentDays + lateDays) / totalDays) * 100).toFixed(1)),
  };
};

const getTodayAttendance = async (doctorId, healthCenterId) => {
  const today = normalizeDate(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return Attendance.findOne({
    doctor: doctorId,
    healthCenter: healthCenterId,
    date: { $gte: today, $lt: tomorrow },
  }).populate('doctor', 'name email').populate('healthCenter', 'name');
};

const upsertDailyAttendance = async ({ doctorId, healthCenterId, loginTime, logoutTime, status, notes }) => {
  const doctor = await User.findById(doctorId);
  if (!doctor) throw new AppError('Doctor not found.', HTTP.NOT_FOUND);

  if (doctor.role !== ROLES.DOCTOR && doctor.role !== ROLES.STAFF) {
    throw new AppError('Only doctors can mark attendance.', HTTP.FORBIDDEN);
  }

  const center = await HealthCenter.findById(healthCenterId);
  if (!center) throw new AppError('Health center not found.', HTTP.NOT_FOUND);

  const today = normalizeDate(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const existing = await Attendance.findOne({
    doctor: doctorId,
    healthCenter: healthCenterId,
    date: { $gte: today, $lt: tomorrow },
  });

  const now = loginTime ? new Date(loginTime) : new Date();
  const computedStatus = status || determineAttendanceStatus(now);

  const attendanceData = {
    doctor: doctorId,
    healthCenter: healthCenterId,
    date: today,
    status: computedStatus,
    loginTime: loginTime ? new Date(loginTime) : now,
    logoutTime: logoutTime ? new Date(logoutTime) : null,
    notes: notes || '',
  };

  if (existing) {
    Object.assign(existing, attendanceData);
    return existing.save();
  }

  return Attendance.create(attendanceData);
};

const getAttendanceRecords = async ({ doctorId, healthCenterId, startDate, endDate }) => {
  const filter = {};
  if (doctorId) filter.doctor = doctorId;
  if (healthCenterId) filter.healthCenter = healthCenterId;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = normalizeDate(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  return Attendance.find(filter)
    .populate('doctor', 'name email')
    .populate('healthCenter', 'name')
    .sort({ date: -1 });
};

const getMonthlyAttendance = async ({ doctorId, healthCenterId, month }) => {
  const baseDate = month ? new Date(month) : new Date();
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const records = await getAttendanceRecords({ doctorId, healthCenterId, startDate: start, endDate: end });

  return {
    month: baseDate.toISOString().slice(0, 7),
    records,
    summary: buildMonthlySummary(records),
    alerts: records.filter((entry) => entry.status === 'late' || entry.status === 'absent').map((entry) => ({
      date: entry.date,
      status: entry.status,
      doctor: entry.doctor?.name || 'Doctor',
    })),
  };
};

module.exports = {
  determineAttendanceStatus,
  buildMonthlySummary,
  getTodayAttendance,
  upsertDailyAttendance,
  getAttendanceRecords,
  getMonthlyAttendance,
};
