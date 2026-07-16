'use strict';

const RoleRequest = require('../models/RoleRequest');
const Report = require('../models/Report');
const { AppError } = require('./errorHandler');
const { HTTP, ROLES } = require('../config/constants');

/**
 * Access control middleware for sensitive uploads.
 * @param {string} type - 'verifications' | 'reports' | 'patients'
 */
const uploadAccessControl = (type) => async (req, res, next) => {
  const fileUrl = (req.baseUrl + req.path).replace(/\\/g, '/');

  try {
    // 1. Super Admin is always allowed
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (type === 'verifications') {
      const docRequest = await RoleRequest.findOne({ verificationDoc: fileUrl }).populate('user');
      if (!docRequest) {
        // If request no longer exists, restrict to admin only
        if (req.user.role === ROLES.DISTRICT_ADMIN) {
          return next();
        }
        return next(new AppError('Access denied.', HTTP.FORBIDDEN));
      }

      // Allow if:
      // - User is the owner of the document
      // - User is a district admin in the same district as the requester
      const isOwner = req.user._id.toString() === docRequest.user?._id.toString();
      const isDistrictAdminMatch = req.user.role === ROLES.DISTRICT_ADMIN && req.user.district === docRequest.user?.district;

      if (isOwner || isDistrictAdminMatch) {
        return next();
      }
      return next(new AppError('Access denied. You cannot view this verification document.', HTTP.FORBIDDEN));
    }

    if (type === 'reports') {
      const report = await Report.findOne({ attachments: fileUrl }).populate('healthCenter');
      if (!report) {
        // If not found in DB, default to District Admin / Super Admin
        if (req.user.role === ROLES.DISTRICT_ADMIN) {
          return next();
        }
        return next(new AppError('Access denied.', HTTP.FORBIDDEN));
      }

      // Allow if:
      // - User is district admin of same district
      // - User is staff/doctor/nurse at the same health center
      const isDistrictAdminMatch = req.user.role === ROLES.DISTRICT_ADMIN && req.user.district === report.healthCenter?.district;
      const isFacilityStaffMatch = 
        [ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE].includes(req.user.role) && 
        req.user.healthCenter?.toString() === report.healthCenter?._id.toString();

      if (isDistrictAdminMatch || isFacilityStaffMatch) {
        return next();
      }
      return next(new AppError('Access denied. You cannot view this report attachment.', HTTP.FORBIDDEN));
    }

    if (type === 'patients') {
      // Patients folder fallback protection. Since patient document upload is not mapped in schema,
      // prevent CITIZEN access entirely, allow STAFF/DOCTOR/NURSE/DISTRICT_ADMIN/SUPER_ADMIN.
      if (req.user.role === ROLES.CITIZEN) {
        return next(new AppError('Access denied.', HTTP.FORBIDDEN));
      }
      return next();
    }

    return next(new AppError('Invalid upload type access check.', HTTP.BAD_REQUEST));
  } catch (err) {
    return next(err);
  }
};

module.exports = uploadAccessControl;
