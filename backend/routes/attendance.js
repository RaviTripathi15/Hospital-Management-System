'use strict';

const express = require('express');
const router = express.Router();

const {
  markAttendance,
  getMyAttendance,
  getAttendanceRecords,
  getMonthlyReport,
} = require('../controllers/attendanceController');
const { protect, requireAnyRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(protect);

router.post('/', requireAnyRole(ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE), markAttendance);
router.get('/me', getMyAttendance);
router.get('/records', requireAnyRole(ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), getAttendanceRecords);
router.get('/report', requireAnyRole(ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), getMonthlyReport);

module.exports = router;
