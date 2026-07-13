'use strict';

const RoleRequest = require('../models/RoleRequest');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/apiResponse');
const { HTTP, ROLES } = require('../config/constants');
const logger = require('../config/logger');

// Create a new role switch request
exports.createRequest = asyncHandler(async (req, res, next) => {
  const { requestedRole, employeeId, hospitalCode } = req.body;

  if (!requestedRole || !Object.values(ROLES).includes(requestedRole)) {
    return next(new AppError('Invalid requested role.', HTTP.BAD_REQUEST));
  }

  // Check if they are trying to request their current role
  if (req.user.role === requestedRole) {
    return next(new AppError('You already have this role.', HTTP.BAD_REQUEST));
  }

  // Check for existing pending request
  const existingPending = await RoleRequest.findOne({
    user: req.user._id,
    status: 'pending',
  });
  if (existingPending) {
    return next(new AppError('You already have a pending role switch request.', HTTP.CONFLICT));
  }

  // If requesting Citizen, approve immediately (does not require verification docs)
  if (requestedRole === ROLES.CITIZEN) {
    const previousRole = req.user.role;
    req.user.role = ROLES.CITIZEN;
    await req.user.save();

    // Create approved request log
    const request = await RoleRequest.create({
      user: req.user._id,
      requestedRole: ROLES.CITIZEN,
      status: 'approved',
      adminFeedback: 'Auto-approved transition to Citizen role.',
    });

    const accessToken = req.user.getSignedJwtToken();
    const refreshToken = req.user.getRefreshToken();

    logger.info(`User ${req.user.email} auto-switched to Citizen role.`);

    return res.status(HTTP.OK).json(
      success(
        {
          request,
          user: req.user.toPublic(),
          accessToken,
          refreshToken,
          autoApproved: true,
        },
        'Role switched to Citizen successfully.'
      )
    );
  }

  // Verification is required for staff, doctor, admins
  if (!employeeId || !hospitalCode) {
    return next(new AppError('Employee ID and Hospital Code are required for this role.', HTTP.BAD_REQUEST));
  }

  if (!req.file) {
    return next(new AppError('Verification document upload is required for this role.', HTTP.BAD_REQUEST));
  }

  const verificationDocPath = `/uploads/verifications/${req.file.filename}`;

  const request = await RoleRequest.create({
    user: req.user._id,
    requestedRole,
    employeeId,
    hospitalCode,
    verificationDoc: verificationDocPath,
    status: 'pending',
  });

  logger.info(`User ${req.user.email} submitted role switch request for ${requestedRole}`);

  return res.status(HTTP.CREATED).json(
    success(request, 'Role switch request submitted successfully and is pending approval.')
  );
});

// Get logged-in user's latest request
exports.getMyRequest = asyncHandler(async (req, res) => {
  const request = await RoleRequest.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  return res.status(HTTP.OK).json(success(request, 'Latest role request retrieved.'));
});

// Get all requests (Admin only)
exports.getRequests = asyncHandler(async (req, res) => {
  const statusFilter = req.query.status;
  const query = {};
  if (statusFilter) {
    query.status = statusFilter;
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const total = await RoleRequest.countDocuments(query);
  const requests = await RoleRequest.find(query)
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.status(HTTP.OK).json(
    success(
      {
        requests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      'Role requests retrieved successfully.'
    )
  );
});

// Approve role request (Admin only)
exports.approveRequest = asyncHandler(async (req, res, next) => {
  const request = await RoleRequest.findById(req.params.id);
  if (!request) {
    return next(new AppError('Role request not found.', HTTP.NOT_FOUND));
  }

  if (request.status !== 'pending') {
    return next(new AppError(`Request has already been ${request.status}.`, HTTP.BAD_REQUEST));
  }

  const targetUser = await User.findById(request.user);
  if (!targetUser) {
    return next(new AppError('User not found.', HTTP.NOT_FOUND));
  }

  // Update User Role
  targetUser.role = request.requestedRole;
  await targetUser.save({ validateBeforeSave: false });

  // Update request status
  request.status = 'approved';
  request.adminFeedback = req.body.adminFeedback || 'Approved by administrator.';
  await request.save();

  // Generate tokens for target user
  const accessToken = targetUser.getSignedJwtToken();
  const refreshToken = targetUser.getRefreshToken();

  // Socket notification
  const io = req.app.get('io');
  if (io) {
    const userRoom = `user_${targetUser._id.toString()}`;
    logger.info(`Emitting role_update to room: ${userRoom}`);
    io.to(userRoom).emit('role_update', {
      role: targetUser.role,
      accessToken,
      refreshToken,
      user: targetUser.toPublic(),
      message: `Your request to switch to ${targetUser.role.replace('_', ' ')} has been approved.`,
    });
  }

  logger.info(`Admin approved role request ${request._id}. User ${targetUser.email} is now ${targetUser.role}.`);

  return res.status(HTTP.OK).json(success(request, 'Role request approved successfully.'));
});

// Reject role request (Admin only)
exports.rejectRequest = asyncHandler(async (req, res, next) => {
  const request = await RoleRequest.findById(req.params.id);
  if (!request) {
    return next(new AppError('Role request not found.', HTTP.NOT_FOUND));
  }

  if (request.status !== 'pending') {
    return next(new AppError(`Request has already been ${request.status}.`, HTTP.BAD_REQUEST));
  }

  // Update request status
  request.status = 'rejected';
  request.adminFeedback = req.body.adminFeedback || 'Rejected by administrator.';
  await request.save();

  // Socket notification
  const io = req.app.get('io');
  if (io) {
    const userRoom = `user_${request.user.toString()}`;
    logger.info(`Emitting role_request_rejected to room: ${userRoom}`);
    io.to(userRoom).emit('role_request_rejected', {
      requestedRole: request.requestedRole,
      adminFeedback: request.adminFeedback,
    });
  }

  logger.info(`Admin rejected role request ${request._id}.`);

  return res.status(HTTP.OK).json(success(request, 'Role request rejected successfully.'));
});
