'use strict';

const express = require('express');
const router = express.Router();

const {
  getAllReports, getReportById, createReport, updateReport,
  submitReport, approveReport, getReportsByCenter, generateSummary,
} = require('../controllers/reportController');

const { protect, requireMinRole, requireAnyRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { paginationValidator, mongoIdParam } = require('../middleware/validator');
const { reportLimiter } = require('../middleware/rateLimiter');
const { uploadReportAttachment } = require('../middleware/upload');

router.use(protect);

router.get('/summary', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), generateSummary);
router.get('/center/:centerId', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), paginationValidator, getReportsByCenter);

router.get('/', requireMinRole(ROLES.STAFF), paginationValidator, getAllReports);
router.post('/', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), reportLimiter, uploadReportAttachment, createReport);

router
  .route('/:id')
  .get(requireMinRole(ROLES.STAFF), mongoIdParam(), getReportById)
  .put(requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), mongoIdParam(), updateReport);

router.patch('/:id/submit', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), mongoIdParam(), submitReport);
router.patch('/:id/approve', requireMinRole(ROLES.DISTRICT_ADMIN), mongoIdParam(), approveReport);

module.exports = router;
