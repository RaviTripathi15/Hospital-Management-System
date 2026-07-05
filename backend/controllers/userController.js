'use strict';

const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/apiResponse');
const { getPaginationParams, paginateQuery } = require('../utils/pagination');
const { HTTP, ROLES, ROLE_HIERARCHY } = require('../config/constants');

// ─── @route GET /api/v1/users ─────────────────────────────────────────────────
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = buildUserFilter(req);

  const [users, total] = await Promise.all([
    User.find(filter)
      .populate('healthCenter', 'name district type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(
    paginated(users, { page, limit, total }, 'Users retrieved.')
  );
});

// ─── @route GET /api/v1/users/:id ────────────────────────────────────────────
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate('healthCenter', 'name district type block')
    .lean();

  if (!user) return next(new AppError('User not found.', HTTP.NOT_FOUND));
  return res.status(HTTP.OK).json(success(user, 'User retrieved.'));
});

// ─── @route POST /api/v1/users ────────────────────────────────────────────────
exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone, district, healthCenter } = req.body;

  // Enforce role hierarchy — cannot create a user with higher role than yourself
  const callerRank = ROLE_HIERARCHY.indexOf(req.user.role);
  const targetRank = ROLE_HIERARCHY.indexOf(role);
  if (targetRank >= callerRank && req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new AppError('You cannot create a user with an equal or higher role.', HTTP.FORBIDDEN));
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return next(new AppError('Email already exists.', HTTP.CONFLICT));

  const user = await User.create({ name, email, password, role, phone, district, healthCenter });

  return res.status(HTTP.CREATED).json(success(user.toPublic(), 'User created successfully.'));
});

// ─── @route PUT /api/v1/users/:id ────────────────────────────────────────────
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', HTTP.NOT_FOUND));

  // Cannot update a user with higher/equal rank (unless super_admin)
  const callerRank = ROLE_HIERARCHY.indexOf(req.user.role);
  const targetRank = ROLE_HIERARCHY.indexOf(user.role);
  if (targetRank >= callerRank && req.user._id.toString() !== user._id.toString() && req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new AppError('You cannot modify a user with equal or higher privileges.', HTTP.FORBIDDEN));
  }

  const allowedUpdates = ['name', 'phone', 'district', 'healthCenter', 'gender', 'isActive'];
  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (req.file) updates.profilePic = `/uploads/profiles/${req.file.filename}`;

  const updated = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('healthCenter', 'name type district');

  return res.status(HTTP.OK).json(success(updated.toPublic(), 'User updated.'));
});

// ─── @route DELETE /api/v1/users/:id ─────────────────────────────────────────
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', HTTP.NOT_FOUND));

  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot delete your own account.', HTTP.BAD_REQUEST));
  }

  const targetRank = ROLE_HIERARCHY.indexOf(user.role);
  const callerRank = ROLE_HIERARCHY.indexOf(req.user.role);
  if (targetRank >= callerRank && req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new AppError('You cannot delete a user with equal or higher privileges.', HTTP.FORBIDDEN));
  }

  // Soft-delete by deactivating
  await User.findByIdAndUpdate(req.params.id, { isActive: false });
  return res.status(HTTP.OK).json(success(null, 'User deactivated successfully.'));
});

// ─── @route PUT /api/v1/users/:id/role ───────────────────────────────────────
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  if (!role || !Object.values(ROLES).includes(role)) {
    return next(new AppError('Invalid role.', HTTP.BAD_REQUEST));
  }

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', HTTP.NOT_FOUND));

  const newRank = ROLE_HIERARCHY.indexOf(role);
  const callerRank = ROLE_HIERARCHY.indexOf(req.user.role);
  if (newRank >= callerRank && req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new AppError('You cannot assign a role equal to or higher than your own.', HTTP.FORBIDDEN));
  }

  user.role = role;
  await user.save({ validateBeforeSave: false });

  return res.status(HTTP.OK).json(success(user.toPublic(), 'User role updated.'));
});

// ─── @route GET /api/v1/users/center/:centerId ───────────────────────────────
exports.getUsersByCenter = asyncHandler(async (req, res, next) => {
  const { centerId } = req.params;
  const { page, limit, skip } = getPaginationParams(req.query);

  const filter = { healthCenter: centerId, isActive: true };
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpire -refreshToken')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(paginated(users, { page, limit, total }, 'Centre users retrieved.'));
});

// ─── Helper: Build Filter From Query ─────────────────────────────────────────
const buildUserFilter = (req) => {
  const filter = {};
  const { role, district, healthCenter, isActive, search } = req.query;

  if (role) filter.role = role;
  if (district) filter.district = district;
  if (healthCenter) filter.healthCenter = healthCenter;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // District admins can only see users in their district
  if (req.user.role === ROLES.DISTRICT_ADMIN) {
    filter.district = req.user.district;
  }

  // Staff can only see users in their centre
  if (req.user.role === ROLES.STAFF) {
    filter.healthCenter = req.user.healthCenter;
  }

  return filter;
};
