'use strict';

const BedAllocation = require('../models/BedAllocation');
const HealthCenter = require('../models/HealthCenter');
const Patient = require('../models/Patient');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');
const { HTTP, ROLES, NOTIFICATION_TYPES } = require('../config/constants');
const mongoose = require('mongoose');

// ─── @route POST /api/v1/beds/allocate ────────────────────────────────────────
exports.allocateBed = asyncHandler(async (req, res, next) => {
  const { patient: patientId, healthCenter: centerId, bedNumber, wardName } = req.body;

  // 1. Verify health center exists
  const center = await HealthCenter.findById(centerId);
  if (!center) return next(new AppError('Health center not found.', HTTP.NOT_FOUND));

  // Access check
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== centerId) {
    return next(new AppError('You are not authorized to allocate beds at this facility.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && center.district !== req.user.district) {
    return next(new AppError('You are not authorized to allocate beds outside your district.', HTTP.FORBIDDEN));
  }

  // 2. Verify patient exists and is active
  const patient = await Patient.findById(patientId);
  if (!patient || !patient.isActive) {
    return next(new AppError('Patient not found or inactive.', HTTP.NOT_FOUND));
  }

  // 3. Prevent duplicate active allocations for the same patient
  const activeAlloc = await BedAllocation.findOne({ patient: patientId, status: 'allocated' });
  if (activeAlloc) {
    return next(new AppError(`Patient is already admitted to Bed ${activeAlloc.bedNumber} in ${activeAlloc.wardName}.`, HTTP.CONFLICT));
  }

  // 4. Verify bed availability
  if (center.availableBeds <= 0) {
    return next(new AppError('No beds available at this health center.', HTTP.BAD_REQUEST));
  }

  // 5. Create Allocation
  const allocation = await BedAllocation.create({
    patient: patientId,
    healthCenter: centerId,
    bedNumber,
    wardName,
  });

  // 6. Update Health Center capacity
  center.availableBeds = Math.max(0, center.availableBeds - 1);
  await center.save();

  // 7. Calculate occupancy & trigger emergency alerts if >= 90% or <= 2 beds
  const occupiedBeds = center.totalBeds - center.availableBeds;
  const occupancyPercent = center.totalBeds > 0 ? (occupiedBeds / center.totalBeds) * 100 : 0;

  if ((occupancyPercent >= 90 || center.availableBeds <= 2) && center.inCharge) {
    await createNotification({
      recipient: center.inCharge,
      type: NOTIFICATION_TYPES.BED_ALERT,
      title: 'Emergency Bed Occupancy Alert',
      message: `Critical capacity at ${center.name}: occupancy is at ${occupancyPercent.toFixed(0)}% (${center.availableBeds} beds remaining).`,
      priority: 'critical',
      relatedEntity: { model: 'HealthCenter', id: center._id },
    });
  }

  return res.status(HTTP.CREATED).json(success(allocation, 'Bed allocated successfully.'));
});

// ─── @route POST /api/v1/beds/release/:id ─────────────────────────────────────
exports.releaseBed = asyncHandler(async (req, res, next) => {
  const allocation = await BedAllocation.findById(req.params.id);
  if (!allocation) return next(new AppError('Bed allocation not found.', HTTP.NOT_FOUND));

  if (allocation.status === 'released') {
    return next(new AppError('This bed allocation is already released.', HTTP.BAD_REQUEST));
  }

  const center = await HealthCenter.findById(allocation.healthCenter);
  if (!center) return next(new AppError('Health center not found.', HTTP.NOT_FOUND));

  // Access check
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== allocation.healthCenter.toString()) {
    return next(new AppError('You are not authorized to release beds at this facility.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && center.district !== req.user.district) {
    return next(new AppError('You are not authorized to release beds outside your district.', HTTP.FORBIDDEN));
  }

  // Update allocation record
  allocation.status = 'released';
  allocation.releasedAt = new Date();
  await allocation.save();

  // Increment available beds in Health Center
  center.availableBeds = Math.min(center.totalBeds, center.availableBeds + 1);
  await center.save();

  return res.status(HTTP.OK).json(success(allocation, 'Bed released successfully.'));
});

// ─── @route GET /api/v1/beds/active ──────────────────────────────────────────
exports.getActiveAllocations = asyncHandler(async (req, res, next) => {
  const centerId = req.query.healthCenter || (req.user.healthCenter ? req.user.healthCenter.toString() : null);
  if (!centerId) return next(new AppError('Health center ID is required.', HTTP.BAD_REQUEST));

  const center = await HealthCenter.findById(centerId);
  if (!center) return next(new AppError('Health center not found.', HTTP.NOT_FOUND));

  // Access check
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== centerId) {
    return next(new AppError('Access denied. You can only view bed information for your own facility.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && center.district !== req.user.district) {
    return next(new AppError('Access denied. You can only view bed information in your district.', HTTP.FORBIDDEN));
  }

  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = { healthCenter: centerId, status: 'allocated' };

  const [allocations, total] = await Promise.all([
    BedAllocation.find(filter)
      .populate('patient', 'name age gender patientId phone')
      .sort({ allocatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BedAllocation.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(paginated(allocations, { page, limit, total }, 'Active allocations retrieved.'));
});

// ─── @route GET /api/v1/beds/history ─────────────────────────────────────────
exports.getHistory = asyncHandler(async (req, res, next) => {
  const centerId = req.query.healthCenter || (req.user.healthCenter ? req.user.healthCenter.toString() : null);
  if (!centerId) return next(new AppError('Health center ID is required.', HTTP.BAD_REQUEST));

  const center = await HealthCenter.findById(centerId);
  if (!center) return next(new AppError('Health center not found.', HTTP.NOT_FOUND));

  // Access check
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== centerId) {
    return next(new AppError('Access denied. You can only view bed information for your own facility.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && center.district !== req.user.district) {
    return next(new AppError('Access denied. You can only view bed information in your district.', HTTP.FORBIDDEN));
  }

  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = { healthCenter: centerId, status: 'released' };

  const [allocations, total] = await Promise.all([
    BedAllocation.find(filter)
      .populate('patient', 'name age gender patientId phone')
      .sort({ releasedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BedAllocation.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(paginated(allocations, { page, limit, total }, 'Historical allocations retrieved.'));
});

// ─── @route GET /api/v1/beds/stats ───────────────────────────────────────────
exports.getBedStats = asyncHandler(async (req, res, next) => {
  const centerId = req.query.healthCenter || (req.user.healthCenter ? req.user.healthCenter.toString() : null);
  if (!centerId) return next(new AppError('Health center ID is required.', HTTP.BAD_REQUEST));

  const center = await HealthCenter.findById(centerId).select('name totalBeds availableBeds district');
  if (!center) return next(new AppError('Health center not found.', HTTP.NOT_FOUND));

  // Access check
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== centerId) {
    return next(new AppError('Access denied. You can only view bed information for your own facility.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && center.district !== req.user.district) {
    return next(new AppError('Access denied. You can only view bed information in your district.', HTTP.FORBIDDEN));
  }

  const occupiedBeds = center.totalBeds - center.availableBeds;
  const occupancyRate = center.totalBeds > 0 ? Math.round((occupiedBeds / center.totalBeds) * 100) : 0;

  // Aggregate ward breakdowns
  const wardBreakdown = await BedAllocation.aggregate([
    { $match: { healthCenter: new mongoose.Types.ObjectId(centerId), status: 'allocated' } },
    {
      $group: {
        _id: '$wardName',
        occupiedCount: { $sum: 1 },
      },
    },
    { $sort: { occupiedCount: -1 } },
  ]);

  const formattedWards = wardBreakdown.map((w) => ({
    wardName: w._id,
    occupied: w.occupiedCount,
  }));

  return res.status(HTTP.OK).json(
    success(
      {
        totalBeds: center.totalBeds,
        availableBeds: center.availableBeds,
        occupiedBeds,
        occupancyRate,
        wardBreakdown: formattedWards,
      },
      'Bed stats retrieved.'
    )
  );
});
