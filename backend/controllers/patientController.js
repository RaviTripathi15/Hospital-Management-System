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
  const filter = await buildPatientFilter(req);

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

  // Role and center checks
  if (req.user.role === ROLES.STAFF && patient.healthCenter?._id?.toString() !== req.user.healthCenter?.toString()) {
    return next(new AppError('Access denied. You can only view patients at your health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && patient.healthCenter?.district !== req.user.district) {
    return next(new AppError('Access denied. You can only view patients in your district.', HTTP.FORBIDDEN));
  }

  return res.status(HTTP.OK).json(success(patient, 'Patient retrieved.'));
});

// ─── @route POST /api/v1/patients ────────────────────────────────────────────
exports.registerPatient = asyncHandler(async (req, res, next) => {
  const { healthCenter: centerId } = req.body;

  const center = await HealthCenter.findById(centerId);
  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));

  // Role and center checks
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== centerId) {
    return next(new AppError('You can only register patients at your health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && center.district !== req.user.district) {
    return next(new AppError('You can only register patients in your district.', HTTP.FORBIDDEN));
  }

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
  const patient = await Patient.findById(req.params.id).populate('healthCenter');
  if (!patient) return next(new AppError('Patient not found.', HTTP.NOT_FOUND));

  // Staff can only update patients in their centre
  if (req.user.role === ROLES.STAFF && patient.healthCenter?._id?.toString() !== req.user.healthCenter?.toString()) {
    return next(new AppError('You can only update patients at your health centre.', HTTP.FORBIDDEN));
  }
  // District admin can only update patients in their district
  if (req.user.role === ROLES.DISTRICT_ADMIN && patient.healthCenter?.district !== req.user.district) {
    return next(new AppError('You can only update patients in your district.', HTTP.FORBIDDEN));
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

  // Access check
  if (req.user.role === ROLES.STAFF && patient.healthCenter?.toString() !== req.user.healthCenter?.toString()) {
    return next(new AppError('Access denied. You can only record visits for patients at your health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN) {
    const center = await HealthCenter.findById(patient.healthCenter);
    if (!center || center.district !== req.user.district) {
      return next(new AppError('Access denied. You can only record visits for patients in your district.', HTTP.FORBIDDEN));
    }
  }

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
    .populate('healthCenter', 'district')
    .select('medicalHistory name patientId healthCenter');

  if (!patient) return next(new AppError('Patient not found.', HTTP.NOT_FOUND));

  // Access check
  if (req.user.role === ROLES.STAFF && patient.healthCenter?._id?.toString() !== req.user.healthCenter?.toString()) {
    return next(new AppError('Access denied. You can only view medical history of patients at your health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && patient.healthCenter?.district !== req.user.district) {
    return next(new AppError('Access denied. You can only view medical history of patients in your district.', HTTP.FORBIDDEN));
  }

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
  } else if (req.user.role === ROLES.DISTRICT_ADMIN) {
    const centers = await HealthCenter.find({ district: req.user.district, isActive: true }).select('_id');
    filter.healthCenter = { $in: centers.map(c => c._id) };
  }

  const patients = await Patient.find(filter)
    .select('patientId name age gender phone bloodGroup healthCenter')
    .populate('healthCenter', 'name')
    .limit(20)
    .lean();

  return res.status(HTTP.OK).json(success(patients, 'Search results.'));
});

// ─── @route GET /api/v1/patients/center/:centerId ────────────────────────────
exports.getPatientsByCenter = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  // Access check
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== req.params.centerId) {
    return next(new AppError('Access denied. You can only view patients at your health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN) {
    const center = await HealthCenter.findById(req.params.centerId);
    if (!center || center.district !== req.user.district) {
      return next(new AppError('Access denied. You can only view patients in your district.', HTTP.FORBIDDEN));
    }
  }

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
const buildPatientFilter = async (req) => {
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
    const centers = await HealthCenter.find({ district: req.user.district, isActive: true }).select('_id');
    const centerIds = centers.map((c) => c._id);
    if (healthCenter) {
      if (!centerIds.map((id) => id.toString()).includes(healthCenter.toString())) {
        filter.healthCenter = null; // force empty
      }
    } else {
      filter.healthCenter = { $in: centerIds };
    }
  }

  return filter;
};

// ─── @route GET /api/v1/patients/my-profile ─────────────────────────────────
exports.getCitizenPatientProfile = asyncHandler(async (req, res, next) => {
  if (!req.user.phone) {
    return res.status(HTTP.OK).json(success([], 'No phone number in user profile.'));
  }

  const patients = await Patient.find({ phone: req.user.phone, isActive: true })
    .populate('healthCenter', 'name district type block contactNumber');

  return res.status(HTTP.OK).json(success(patients, 'My patient profiles retrieved.'));
});
