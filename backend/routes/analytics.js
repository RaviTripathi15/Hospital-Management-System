'use strict';

const express = require('express');
const router = express.Router();

const {
  getDashboardStats, getDistrictStats, getNationalStats,
  getInventoryAnalytics, getAppointmentTrends, getPatientDemographics,
} = require('../controllers/analyticsController');

const { protect, requireMinRole, requireAnyRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { analyticsLimiter } = require('../middleware/rateLimiter');

router.use(protect, analyticsLimiter);

router.get('/dashboard', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), getDashboardStats);
router.get('/district', requireMinRole(ROLES.DISTRICT_ADMIN), getDistrictStats);
router.get('/national', requireMinRole(ROLES.SUPER_ADMIN), getNationalStats);
router.get('/inventory', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), getInventoryAnalytics);
router.get('/appointment-trends', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), getAppointmentTrends);
router.get('/patient-demographics', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), getPatientDemographics);

module.exports = router;
