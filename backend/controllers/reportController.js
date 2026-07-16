'use strict';

const Report = require('../models/Report');
const HealthCenter = require('../models/HealthCenter');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/pagination');
const { aggregateMetrics } = require('../services/reportService');
const { createNotification } = require('../services/notificationService');
const { HTTP, ROLES, REPORT_STATUS, NOTIFICATION_TYPES } = require('../config/constants');

// ─── @route GET /api/v1/reports ───────────────────────────────────────────────
exports.getAllReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = await buildReportFilter(req);

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('healthCenter', 'name district type')
      .populate('submittedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Report.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(paginated(reports, { page, limit, total }, 'Reports retrieved.'));
});

// ─── @route GET /api/v1/reports/:id ──────────────────────────────────────────
exports.getReportById = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id)
    .populate('healthCenter', 'name district type block')
    .populate('submittedBy', 'name email')
    .populate('approvedBy', 'name email');

  if (!report) return next(new AppError('Report not found.', HTTP.NOT_FOUND));

  // Access checks
  if (req.user.role === ROLES.STAFF && report.healthCenter?._id?.toString() !== req.user.healthCenter?.toString()) {
    return next(new AppError('Access denied. You can only view reports of your health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && report.healthCenter?.district !== req.user.district) {
    return next(new AppError('Access denied. You can only view reports in your district.', HTTP.FORBIDDEN));
  }

  return res.status(HTTP.OK).json(success(report, 'Report retrieved.'));
});

// ─── @route POST /api/v1/reports ─────────────────────────────────────────────
exports.createReport = asyncHandler(async (req, res, next) => {
  const { healthCenter: centerId, reportType, period } = req.body;

  const center = await HealthCenter.findById(centerId);
  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));

  // Access checks
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== centerId) {
    return next(new AppError('You can only create reports for your own health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && center.district !== req.user.district) {
    return next(new AppError('You can only create reports for health centres in your district.', HTTP.FORBIDDEN));
  }

  // Check for duplicate
  const existing = await Report.findOne({
    healthCenter: centerId,
    reportType,
    'period.startDate': new Date(period.startDate),
  });
  if (existing) return next(new AppError('A report for this period already exists.', HTTP.CONFLICT));

  // Auto-populate metrics from DB if not manually provided
  let metrics = req.body.metrics;
  if (!metrics || Object.keys(metrics).length === 0) {
    metrics = await aggregateMetrics(centerId, period.startDate, period.endDate);
  }

  const report = await Report.create({
    ...req.body,
    metrics,
    submittedBy: null,
    status: REPORT_STATUS.DRAFT,
  });

  return res.status(HTTP.CREATED).json(success(report, 'Report created.'));
});

// ─── @route PUT /api/v1/reports/:id ──────────────────────────────────────────
exports.updateReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id).populate('healthCenter');
  if (!report) return next(new AppError('Report not found.', HTTP.NOT_FOUND));

  // Access checks
  if (req.user.role === ROLES.STAFF && report.healthCenter?._id?.toString() !== req.user.healthCenter?.toString()) {
    return next(new AppError('Access denied. You can only modify reports of your own health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && report.healthCenter?.district !== req.user.district) {
    return next(new AppError('Access denied. You can only modify reports in your district.', HTTP.FORBIDDEN));
  }

  if (report.status === REPORT_STATUS.APPROVED) {
    return next(new AppError('Approved reports cannot be edited.', HTTP.FORBIDDEN));
  }

  const disallowed = ['healthCenter', 'submittedBy', 'approvedBy', 'submittedAt', 'approvedAt'];
  disallowed.forEach((f) => delete req.body[f]);

  const updated = await Report.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  }).populate('healthCenter', 'name');

  return res.status(HTTP.OK).json(success(updated, 'Report updated.'));
});

// ─── @route PATCH /api/v1/reports/:id/submit ─────────────────────────────────
exports.submitReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id).populate('healthCenter');
  if (!report) return next(new AppError('Report not found.', HTTP.NOT_FOUND));

  // Access checks
  if (req.user.role === ROLES.STAFF && report.healthCenter?._id?.toString() !== req.user.healthCenter?.toString()) {
    return next(new AppError('Access denied. You can only modify reports of your own health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && report.healthCenter?.district !== req.user.district) {
    return next(new AppError('Access denied. You can only modify reports in your district.', HTTP.FORBIDDEN));
  }

  if (report.status !== REPORT_STATUS.DRAFT) {
    return next(new AppError('Only draft reports can be submitted.', HTTP.BAD_REQUEST));
  }

  report.status = REPORT_STATUS.SUBMITTED;
  report.submittedBy = req.user._id;
  report.submittedAt = new Date();
  await report.save();

  // Notify district admins
  const User = require('../models/User');
  const districtAdmins = await User.find({
    role: ROLES.DISTRICT_ADMIN,
    district: report.healthCenter.district,
    isActive: true,
  });

  for (const admin of districtAdmins) {
    await createNotification({
      recipient: admin._id,
      type: NOTIFICATION_TYPES.REPORT_DUE,
      title: 'Report Submitted for Review',
      message: `${report.reportType} report from ${report.healthCenter.name} is ready for approval.`,
      relatedEntity: { model: 'Report', id: report._id },
    });
  }

  return res.status(HTTP.OK).json(success(report, 'Report submitted for approval.'));
});

// ─── @route PATCH /api/v1/reports/:id/approve ────────────────────────────────
exports.approveReport = asyncHandler(async (req, res, next) => {
  const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'
  const report = await Report.findById(req.params.id).populate('healthCenter');
  if (!report) return next(new AppError('Report not found.', HTTP.NOT_FOUND));

  // Access check
  if (req.user.role === ROLES.DISTRICT_ADMIN && report.healthCenter?.district !== req.user.district) {
    return next(new AppError('Access denied. You can only approve/reject reports in your district.', HTTP.FORBIDDEN));
  }

  if (report.status !== REPORT_STATUS.SUBMITTED) {
    return next(new AppError('Only submitted reports can be approved/rejected.', HTTP.BAD_REQUEST));
  }

  if (action === 'approve') {
    report.status = REPORT_STATUS.APPROVED;
    report.approvedBy = req.user._id;
    report.approvedAt = new Date();
  } else if (action === 'reject') {
    if (!rejectionReason) return next(new AppError('Rejection reason is required.', HTTP.BAD_REQUEST));
    report.status = REPORT_STATUS.DRAFT;
    report.rejectionReason = rejectionReason;
  } else {
    return next(new AppError('Action must be "approve" or "reject".', HTTP.BAD_REQUEST));
  }

  await report.save();

  // Notify the submitter
  if (report.submittedBy) {
    await createNotification({
      recipient: report.submittedBy,
      type: NOTIFICATION_TYPES.REPORT_APPROVED,
      title: action === 'approve' ? 'Report Approved' : 'Report Rejected',
      message: action === 'approve'
        ? `Your ${report.reportType} report for ${report.healthCenter.name} has been approved.`
        : `Your ${report.reportType} report was rejected: ${rejectionReason}`,
      relatedEntity: { model: 'Report', id: report._id },
    });
  }

  return res.status(HTTP.OK).json(success(report, `Report ${action}d.`));
});

// ─── @route GET /api/v1/reports/center/:centerId ─────────────────────────────
exports.getReportsByCenter = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  // Access checks
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== req.params.centerId) {
    return next(new AppError('Access denied. You can only view reports of your health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN) {
    const center = await HealthCenter.findById(req.params.centerId);
    if (!center || center.district !== req.user.district) {
      return next(new AppError('Access denied. You can only view reports in your district.', HTTP.FORBIDDEN));
    }
  }

  const filter = { healthCenter: req.params.centerId };
  const { status, reportType } = req.query;
  if (status) filter.status = status;
  if (reportType) filter.reportType = reportType;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('submittedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Report.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(paginated(reports, { page, limit, total }, 'Centre reports retrieved.'));
});

// ─── @route GET /api/v1/reports/summary ──────────────────────────────────────
exports.generateSummary = asyncHandler(async (req, res, next) => {
  const { centerId, startDate, endDate, reportType } = req.query;
  if (!centerId || !startDate || !endDate) {
    return next(new AppError('centerId, startDate, and endDate are required.', HTTP.BAD_REQUEST));
  }

  // Access checks
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== centerId) {
    return next(new AppError('Access denied. You can only generate summaries for your health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN) {
    const center = await HealthCenter.findById(centerId);
    if (!center || center.district !== req.user.district) {
      return next(new AppError('Access denied. You can only generate summaries for facilities in your district.', HTTP.FORBIDDEN));
    }
  }

  const metrics = await aggregateMetrics(centerId, startDate, endDate);
  return res.status(HTTP.OK).json(success({ metrics, period: { startDate, endDate }, centerId }, 'Summary generated.'));
});

// ─── Helper ───────────────────────────────────────────────────────────────────
const buildReportFilter = async (req) => {
  const filter = {};
  const { healthCenter, status, reportType, startDate, endDate } = req.query;

  if (healthCenter) filter.healthCenter = healthCenter;
  if (status) filter.status = status;
  if (reportType) filter.reportType = reportType;
  if (startDate) filter['period.startDate'] = { $gte: new Date(startDate) };
  if (endDate) filter['period.endDate'] = { $lte: new Date(endDate) };

  if (req.user.role === ROLES.STAFF && req.user.healthCenter) {
    filter.healthCenter = req.user.healthCenter;
  } else if (req.user.role === ROLES.DISTRICT_ADMIN) {
    const centers = await HealthCenter.find({ district: req.user.district, isActive: true }).select('_id');
    const centerIds = centers.map((c) => c._id);
    if (healthCenter) {
      if (!centerIds.map((id) => id.toString()).includes(healthCenter.toString())) {
        filter.healthCenter = null;
      }
    } else {
      filter.healthCenter = { $in: centerIds };
    }
  }

  return filter;
};
