'use strict';

const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const HealthCenter = require('../models/HealthCenter');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');
const { HTTP, ROLES, APPOINTMENT_STATUS, NOTIFICATION_TYPES } = require('../config/constants');

// ─── @route GET /api/v1/appointments ─────────────────────────────────────────
exports.getAllAppointments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = buildFilter(req);

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patient', 'name patientId phone')
      .populate('healthCenter', 'name district')
      .populate('doctor', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(paginated(appointments, { page, limit, total }, 'Appointments retrieved.'));
});

// ─── @route GET /api/v1/appointments/:id ─────────────────────────────────────
exports.getAppointmentById = asyncHandler(async (req, res, next) => {
  const appt = await Appointment.findById(req.params.id)
    .populate('patient', 'name patientId age gender phone bloodGroup allergies')
    .populate('healthCenter', 'name district type contactNumber')
    .populate('doctor', 'name email phone')
    .populate('createdBy', 'name');

  if (!appt) return next(new AppError('Appointment not found.', HTTP.NOT_FOUND));

  // Check permissions: Citizens can only view their own appointments
  const isStaffOrAdmin = [ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN].includes(req.user.role);
  if (!isStaffOrAdmin && appt.createdBy?.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied. You can only view your own appointments.', HTTP.FORBIDDEN));
  }

  return res.status(HTTP.OK).json(success(appt, 'Appointment retrieved.'));
});

// ─── @route POST /api/v1/appointments ────────────────────────────────────────
exports.createAppointment = asyncHandler(async (req, res, next) => {
  const { patient: patientId, healthCenter: centerId, date, doctor } = req.body;

  const [patient, center] = await Promise.all([
    Patient.findById(patientId),
    HealthCenter.findById(centerId),
  ]);

  if (!patient) return next(new AppError('Patient not found.', HTTP.NOT_FOUND));
  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));

  // Check for conflicting appointment (same doctor, date, timeslot)
  if (doctor) {
    const conflict = await Appointment.findOne({
      doctor,
      date: new Date(date),
      timeSlot: req.body.timeSlot,
      status: { $in: [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.IN_PROGRESS] },
    });
    if (conflict) return next(new AppError('Doctor already has an appointment at that time slot.', HTTP.CONFLICT));
  }

  // Generate token number for the day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const tokenCount = await Appointment.countDocuments({
    healthCenter: centerId,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  const appointment = await Appointment.create({
    ...req.body,
    createdBy: req.user._id,
    tokenNumber: tokenCount + 1,
  });

  // Notify the doctor
  if (doctor) {
    await createNotification({
      recipient: doctor,
      type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
      title: 'New Appointment Assigned',
      message: `Appointment with ${patient.name} on ${new Date(date).toLocaleDateString()} at ${req.body.timeSlot}.`,
      relatedEntity: { model: 'Appointment', id: appointment._id },
    });
  }

  // Emit socket
  const io = req.app.get('io');
  if (io) {
    io.to(`center-${centerId}`).emit('appointment:created', {
      appointmentId: appointment._id,
      patientName: patient.name,
      tokenNumber: appointment.tokenNumber,
    });
  }

  const populated = await appointment.populate([
    { path: 'patient', select: 'name patientId' },
    { path: 'doctor', select: 'name' },
  ]);

  return res.status(HTTP.CREATED).json(success(populated, 'Appointment created.'));
});

// ─── @route PUT /api/v1/appointments/:id ─────────────────────────────────────
exports.updateAppointment = asyncHandler(async (req, res, next) => {
  const appt = await Appointment.findById(req.params.id);
  if (!appt) return next(new AppError('Appointment not found.', HTTP.NOT_FOUND));

  // Check permissions: Citizens can only update their own appointments
  const isStaffOrAdmin = [ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN].includes(req.user.role);
  if (!isStaffOrAdmin && appt.createdBy?.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied. You can only update your own appointments.', HTTP.FORBIDDEN));
  }

  if (appt.status === APPOINTMENT_STATUS.CANCELLED) {
    return next(new AppError('Cannot update a cancelled appointment.', HTTP.BAD_REQUEST));
  }

  const disallowed = ['patient', 'healthCenter', 'createdBy', 'tokenNumber'];
  disallowed.forEach((f) => delete req.body[f]);

  // If marking completed, set completedAt
  if (req.body.status === APPOINTMENT_STATUS.COMPLETED && !appt.completedAt) {
    req.body.completedAt = new Date();
  }

  const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('patient', 'name patientId').populate('doctor', 'name');

  // Update patient medical history if completed
  if (req.body.status === APPOINTMENT_STATUS.COMPLETED) {
    const visitData = {
      visitDate: appt.date,
      appointmentType: appt.type,
      doctor: appt.doctor,
      healthCenter: appt.healthCenter,
      symptoms: req.body.symptoms || appt.symptoms,
      diagnosis: req.body.diagnosis,
      prescription: req.body.prescription,
      vitals: req.body.vitals,
      notes: req.body.notes,
      followUpDate: req.body.followUpDate,
    };
    await Patient.findByIdAndUpdate(appt.patient, {
      $push: { medicalHistory: visitData },
    });
  }

  return res.status(HTTP.OK).json(success(updated, 'Appointment updated.'));
});

// ─── @route PATCH /api/v1/appointments/:id/cancel ────────────────────────────
exports.cancelAppointment = asyncHandler(async (req, res, next) => {
  const appt = await Appointment.findById(req.params.id);
  if (!appt) return next(new AppError('Appointment not found.', HTTP.NOT_FOUND));

  // Check permissions: Citizens can only cancel their own appointments
  const isStaffOrAdmin = [ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN].includes(req.user.role);
  if (!isStaffOrAdmin && appt.createdBy?.toString() !== req.user._id.toString()) {
    return next(new AppError('Access denied. You can only cancel your own appointments.', HTTP.FORBIDDEN));
  }

  if (appt.status === APPOINTMENT_STATUS.COMPLETED) {
    return next(new AppError('Cannot cancel a completed appointment.', HTTP.BAD_REQUEST));
  }

  appt.status = APPOINTMENT_STATUS.CANCELLED;
  appt.cancellationReason = req.body.reason || 'No reason provided.';
  await appt.save();

  // Notify doctor
  if (appt.doctor) {
    await createNotification({
      recipient: appt.doctor,
      type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
      title: 'Appointment Cancelled',
      message: `Appointment token #${appt.tokenNumber} on ${appt.date.toLocaleDateString()} has been cancelled.`,
      relatedEntity: { model: 'Appointment', id: appt._id },
    });
  }

  return res.status(HTTP.OK).json(success(appt, 'Appointment cancelled.'));
});

// ─── @route GET /api/v1/appointments/center/:centerId ────────────────────────
exports.getAppointmentsByCenter = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, type, startDate, endDate } = req.query;

  const filter = { healthCenter: req.params.centerId };
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patient', 'name patientId phone')
      .populate('doctor', 'name')
      .sort({ date: 1, tokenNumber: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(paginated(appointments, { page, limit, total }, 'Centre appointments retrieved.'));
});

// ─── @route GET /api/v1/appointments/doctor/:doctorId ────────────────────────
exports.getAppointmentsByDoctor = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, date } = req.query;

  const filter = { doctor: req.params.doctorId };
  if (status) filter.status = status;
  if (date) {
    const d = new Date(date);
    filter.date = {
      $gte: new Date(d.setHours(0, 0, 0, 0)),
      $lte: new Date(d.setHours(23, 59, 59, 999)),
    };
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patient', 'name patientId age gender')
      .sort({ date: 1, tokenNumber: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(paginated(appointments, { page, limit, total }, "Doctor's appointments retrieved."));
});

// ─── @route GET /api/v1/appointments/today ───────────────────────────────────
exports.getTodayAppointments = asyncHandler(async (req, res) => {
  const now = new Date();
  const start = new Date(now.setHours(0, 0, 0, 0));
  const end = new Date(now.setHours(23, 59, 59, 999));

  const filter = {
    date: { $gte: start, $lte: end },
  };

  if (req.user.role === ROLES.STAFF && req.user.healthCenter) {
    filter.healthCenter = req.user.healthCenter;
  }
  if (req.user.role === ROLES.STAFF && req.query.doctorMode === 'true') {
    filter.doctor = req.user._id;
  }

  const appointments = await Appointment.find(filter)
    .populate('patient', 'name patientId age gender phone')
    .populate('doctor', 'name')
    .populate('healthCenter', 'name')
    .sort({ tokenNumber: 1 })
    .lean();

  return res.status(HTTP.OK).json(success(appointments, "Today's appointments retrieved."));
});

// ─── @route GET /api/v1/appointments/my ───────────────────────────────────────
exports.getMyAppointments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  let filter = {};
  if (req.user.role === ROLES.CITIZEN) {
    filter.createdBy = req.user._id;
  } else if (req.user.role === ROLES.DOCTOR) {
    filter.doctor = req.user._id;
  } else if (req.user.role === ROLES.STAFF && req.user.healthCenter) {
    filter.healthCenter = req.user.healthCenter;
  } else {
    filter.createdBy = req.user._id;
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patient', 'name patientId phone')
      .populate('healthCenter', 'name district')
      .populate('doctor', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(paginated(appointments, { page, limit, total }, 'My appointments retrieved.'));
});

// ─── Helper ───────────────────────────────────────────────────────────────────
const buildFilter = (req) => {
  const filter = {};
  const { healthCenter, status, type, patient, doctor, startDate, endDate } = req.query;

  if (healthCenter) filter.healthCenter = healthCenter;
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (patient) filter.patient = patient;
  if (doctor) filter.doctor = doctor;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  if (req.user.role === ROLES.CITIZEN) {
    filter.createdBy = req.user._id;
  } else if (req.user.role === ROLES.STAFF && req.user.healthCenter) {
    filter.healthCenter = req.user.healthCenter;
  }

  return filter;
};
