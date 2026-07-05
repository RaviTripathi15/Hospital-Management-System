'use strict';

const Patient = require('../models/Patient');
const HealthCenter = require('../models/HealthCenter');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/pagination');
const { generatePatientId } = require('../utils/helpers');
const { createNotification } = require('../services/notificationService');
const { HTTP, ROLES, NOTIFICATION_TYPES } = require('../config/constants');

// ─── @route GET /api/v1/patients ─────────────────────────────────────────────
exports.getAllPatients = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = buildPatientFilter(req);

  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .populate('healthCenter', 'name district type')
      .populate('registeredBy', 'name')
      .select('-medicalHistory -aadhaarNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Patient.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(paginated(patients, { page, limit, total }, 'Patients retrieved.'));
});

// ─── @route GET /api/v1/patients/:id ─────────────────────────────────────────
exports.getPatientById = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id)
    .populate('healthCenter', 'name district type block contactNumber')
    .populate('registeredBy', 'name email')
    .populate('medicalHistory.doctor', 'name')
    .populate('medicalHistory.healthCenter', 'name');

  if (!patient) return next(new AppError('Patient not found.', HTTP.NOT_FOUND));
  return res.status(HTTP.OK).json(success(patient, 'Patient retrieved.'));
});

// ─── @route POST /api/v1/patients ────────────────────────────────────────────
exports.registerPatient = asyncHandler(async (req, res, next) => {
  const { healthCenter: centerId } = req.body;

  const center = await HealthCenter.findById(centerId);
  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));

  // Generate unique patient ID
  const patientId = await generatePatientId(center.district, center.block);

  const patient = await Patient.create({
    ...req.body,
    patientId,
    registeredBy: req.user._id,
  });

  // Notify in-charge of new patient registration
  if (center.inCharge) {
    await createNotification({
      recipient: center.inCharge,
      type: NOTIFICATION_TYPES.NEW_PATIENT,
      title: 'New Patient Registered',
      message: `${patient.name} (${patientId}) has been registered at ${center.name}.`,
      relatedEntity: { model: 'Patient', id: patient._id },
    });
  }

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(`center-${centerId}`).emit('patient:registered', { patientId, name: patient.name });
  }

  return res.status(HTTP.CREATED).json(success(patient, 'Patient registered successfully.'));
});

// ─── @route PUT /api/v1/patients/:id ─────────────────────────────────────────
exports.updatePatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return next(new AppError('Patient not found.', HTTP.NOT_FOUND));

  // Staff can only update patients in their centre
  if (req.user.role === ROLES.STAFF && patient.healthCenter.toString() !== req.user.healthCenter?.toString()) {
    return next(new AppError('You can only update patients at your health centre.', HTTP.FORBIDDEN));
  }

  const disallowed = ['patientId', 'registeredBy', 'medicalHistory'];
  disallowed.forEach((f) => delete req.body[f]);

  const updated = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('healthCenter', 'name type');

  return res.status(HTTP.OK).json(success(updated, 'Patient updated.'));
});

// ─── @route POST /api/v1/patients/:id/visit ──────────────────────────────────
exports.addVisit = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return next(new AppError('Patient not found.', HTTP.NOT_FOUND));

  const visit = {
    ...req.body,
    doctor: req.body.doctor || req.user._id,
    healthCenter: req.body.healthCenter || req.user.healthCenter,
  };

  patient.medicalHistory.push(visit);
  await patient.save();

  return res.status(HTTP.CREATED).json(success(
    patient.medicalHistory[patient.medicalHistory.length - 1],
    'Visit recorded.'
  ));
});

// ─── @route GET /api/v1/patients/:id/history ─────────────────────────────────
exports.getPatientHistory = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  const patient = await Patient.findById(req.params.id)
    .populate('medicalHistory.doctor', 'name')
    .populate('medicalHistory.healthCenter', 'name')
    .select('medicalHistory name patientId');

  if (!patient) return next(new AppError('Patient not found.', HTTP.NOT_FOUND));

  // Manual pagination on embedded array (sorted newest first)
  const sorted = [...patient.medicalHistory].sort((a, b) => b.visitDate - a.visitDate);
  const total = sorted.length;
  const visits = sorted.slice(skip, skip + limit);

  return res.status(HTTP.OK).json(
    paginated(visits, { page, limit, total }, 'Medical history retrieved.')
  );
});

// ─── @route GET /api/v1/patients/search ──────────────────────────────────────
exports.searchPatient = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(HTTP.OK).json(success([], 'Search query too short.'));
  }

  const filter = {
    isActive: true,
    $or: [
      { patientId: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ],
  };

  // Scope to centre/district based on role
  if (req.user.role === ROLES.STAFF && req.user.healthCenter) {
    filter.healthCenter = req.user.healthCenter;
  }

  const patients = await Patient.find(filter)
    .select('patientId name age gender phone bloodGroup healthCenter')
    .populate('healthCenter', 'name')
    .limit(20)
    .lean();

  return res.status(HTTP.OK).json(success(patients, 'Search results.'));
});

// ─── @route GET /api/v1/patients/center/:centerId ────────────────────────────
exports.getPatientsByCenter = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = { healthCenter: req.params.centerId, isActive: true };

  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .select('-medicalHistory -aadhaarNumber')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Patient.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(paginated(patients, { page, limit, total }, 'Centre patients retrieved.'));
});

// ─── Helper ───────────────────────────────────────────────────────────────────
const buildPatientFilter = (req) => {
  const filter = { isActive: true };
  const { healthCenter, gender, bloodGroup, search } = req.query;

  if (healthCenter) filter.healthCenter = healthCenter;
  if (gender) filter.gender = gender;
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { patientId: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  if (req.user.role === ROLES.STAFF && req.user.healthCenter) {
    filter.healthCenter = req.user.healthCenter;
  } else if (req.user.role === ROLES.DISTRICT_ADMIN) {
    // Only filter by district via a join — apply via healthCenter lookup
    // For simplicity, let district admin query across; front-end filters by center
  }

  return filter;
};
