'use strict';

const express = require('express');
const router = express.Router();

const {
  allocateBed,
  releaseBed,
  getActiveAllocations,
  getHistory,
  getBedStats,
} = require('../controllers/bedController');

const { protect, requireAnyRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { allocateBedValidator, paginationValidator, mongoIdParam } = require('../middleware/validator');

router.use(protect);

router.post('/allocate', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), allocateBedValidator, allocateBed);
router.post('/release/:id', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), mongoIdParam(), releaseBed);
router.get('/active', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), paginationValidator, getActiveAllocations);
router.get('/history', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), paginationValidator, getHistory);
router.get('/stats', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), getBedStats);

module.exports = router;
