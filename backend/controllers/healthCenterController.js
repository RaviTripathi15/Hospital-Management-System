'use strict';

const HealthCenter = require('../models/HealthCenter');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Inventory = require('../models/Inventory');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/pagination');
const { HTTP, ROLES } = require('../config/constants');

// ─── @route GET /api/v1/health-centers ───────────────────────────────────────
exports.getAllCenters = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = buildCenterFilter(req);

  const [centers, total] = await Promise.all([
    HealthCenter.find(filter)
      .populate('inCharge', 'name email phone')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    HealthCenter.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(paginated(centers, { page, limit, total }, 'Health centres retrieved.'));
});

// ─── @route GET /api/v1/health-centers/:id ───────────────────────────────────
exports.getCenterById = asyncHandler(async (req, res, next) => {
  const center = await HealthCenter.findById(req.params.id)
    .populate('inCharge', 'name email phone')
    .populate('staff', 'name email role');

  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));
  return res.status(HTTP.OK).json(success(center, 'Health centre retrieved.'));
});

// ─── @route POST /api/v1/health-centers ──────────────────────────────────────
exports.createCenter = asyncHandler(async (req, res, next) => {
  const { registrationNumber } = req.body;

  if (registrationNumber) {
    const existing = await HealthCenter.findOne({ registrationNumber });
    if (existing) return next(new AppError('Registration number already exists.', HTTP.CONFLICT));
  }

  const center = await HealthCenter.create(req.body);

  // If inCharge is specified, update that user's healthCenter ref
  if (center.inCharge) {
    await User.findByIdAndUpdate(center.inCharge, { healthCenter: center._id });
  }

  return res.status(HTTP.CREATED).json(success(center, 'Health centre created.'));
});

// ─── @route PUT /api/v1/health-centers/:id ───────────────────────────────────
exports.updateCenter = asyncHandler(async (req, res, next) => {
  const center = await HealthCenter.findById(req.params.id);
  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));

  // District admin can only update centres in their district
  if (req.user.role === ROLES.DISTRICT_ADMIN && center.district !== req.user.district) {
    return next(new AppError('You can only update centres in your district.', HTTP.FORBIDDEN));
  }

  const disallowedUpdates = ['registrationNumber', 'createdAt'];
  disallowedUpdates.forEach((field) => delete req.body[field]);

  const updated = await HealthCenter.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('inCharge', 'name email');

  return res.status(HTTP.OK).json(success(updated, 'Health centre updated.'));
});

// ─── @route DELETE /api/v1/health-centers/:id ────────────────────────────────
exports.deleteCenter = asyncHandler(async (req, res, next) => {
  const center = await HealthCenter.findById(req.params.id);
  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));

  // Soft delete
  await HealthCenter.findByIdAndUpdate(req.params.id, { isActive: false, operationalStatus: 'closed' });
  return res.status(HTTP.OK).json(success(null, 'Health centre deactivated.'));
});

// ─── @route GET /api/v1/health-centers/:id/stats ────────────────────────────
exports.getCenterStats = asyncHandler(async (req, res, next) => {
  const center = await HealthCenter.findById(req.params.id);
  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));

  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalPatients,
    newPatientsThisMonth,
    todayAppointments,
    pendingAppointments,
    staffCount,
    lowStockItems,
    expiredItems,
  ] = await Promise.all([
    Patient.countDocuments({ healthCenter: req.params.id, isActive: true }),
    Patient.countDocuments({
      healthCenter: req.params.id,
      createdAt: { $gte: startOfMonth },
    }),
    Appointment.countDocuments({
      healthCenter: req.params.id,
      date: { $gte: startOfDay },
    }),
    Appointment.countDocuments({
      healthCenter: req.params.id,
      status: 'scheduled',
      date: { $gte: new Date() },
    }),
    User.countDocuments({ healthCenter: req.params.id, isActive: true }),
    Inventory.countDocuments({
      healthCenter: req.params.id,
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
    }),
    Inventory.countDocuments({
      healthCenter: req.params.id,
      expiryDate: { $lt: new Date() },
      currentStock: { $gt: 0 },
    }),
  ]);

  const stats = {
    totalPatients,
    newPatientsThisMonth,
    todayAppointments,
    pendingAppointments,
    staffCount,
    lowStockItems,
    expiredItems,
    bedCapacity: center.bedCapacity,
    operationalStatus: center.operationalStatus,
  };

  return res.status(HTTP.OK).json(success(stats, 'Centre stats retrieved.'));
});

// ─── @route GET /api/v1/health-centers/nearby ────────────────────────────────
exports.getNearbyCenter = asyncHandler(async (req, res, next) => {
  const { lat, lng, maxDistanceKm = 50 } = req.query;

  if (!lat || !lng) {
    return next(new AppError('Latitude and longitude are required.', HTTP.BAD_REQUEST));
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const maxDist = parseFloat(maxDistanceKm);

  // Haversine-based bounding box approximation (1 degree ≈ 111 km)
  const latDelta = maxDist / 111;
  const lngDelta = maxDist / (111 * Math.cos((latNum * Math.PI) / 180));

  const centers = await HealthCenter.find({
    isActive: true,
    operationalStatus: 'active',
    'coordinates.lat': { $gte: latNum - latDelta, $lte: latNum + latDelta },
    'coordinates.lng': { $gte: lngNum - lngDelta, $lte: lngNum + lngDelta },
  })
    .populate('inCharge', 'name phone')
    .limit(20)
    .lean();

  // Calculate actual distance and sort
  const withDistance = centers
    .map((c) => ({
      ...c,
      distanceKm: haversine(latNum, lngNum, c.coordinates.lat, c.coordinates.lng),
    }))
    .filter((c) => c.distanceKm <= maxDist)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return res.status(HTTP.OK).json(success(withDistance, 'Nearby centres retrieved.'));
});

// ─── @route POST /api/v1/health-centers/:id/staff ────────────────────────────
exports.assignStaff = asyncHandler(async (req, res, next) => {
  const { userId, action } = req.body; // action: 'add' | 'remove'

  const [center, user] = await Promise.all([
    HealthCenter.findById(req.params.id),
    User.findById(userId),
  ]);

  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));
  if (!user) return next(new AppError('User not found.', HTTP.NOT_FOUND));

  if (action === 'add') {
    if (!center.staff.includes(userId)) {
      center.staff.push(userId);
    }
    user.healthCenter = center._id;
  } else if (action === 'remove') {
    center.staff = center.staff.filter((id) => id.toString() !== userId);
    user.healthCenter = null;
  } else {
    return next(new AppError('Action must be "add" or "remove".', HTTP.BAD_REQUEST));
  }

  await Promise.all([center.save(), user.save({ validateBeforeSave: false })]);
  return res.status(HTTP.OK).json(success(center, `Staff ${action === 'add' ? 'assigned' : 'removed'}.`));
});

// ─── @route GET /api/v1/health-centers/:id/staff ───────────────────────────────
exports.getCenterStaff = asyncHandler(async (req, res, next) => {
  const center = await HealthCenter.findById(req.params.id)
    .populate('staff', 'name email role phone')
    .populate('inCharge', 'name email role phone');

  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));

  return res.status(HTTP.OK).json(success({
    inCharge: center.inCharge,
    staff: center.staff,
  }, 'Centre staff retrieved.'));
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const buildCenterFilter = (req) => {
  const filter = {};
  const { district, type, operationalStatus, search, isActive } = req.query;

  if (district) filter.district = district;
  if (type) filter.type = type;
  if (operationalStatus) filter.operationalStatus = operationalStatus;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { block: { $regex: search, $options: 'i' } },
      { registrationNumber: { $regex: search, $options: 'i' } },
    ];
  }

  if (req.user.role === ROLES.DISTRICT_ADMIN) {
    filter.district = req.user.district;
  }

  return filter;
};

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
