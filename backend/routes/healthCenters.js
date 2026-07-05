'use strict';

const express = require('express');
const router = express.Router();

const {
  getAllCenters, getCenterById, createCenter, updateCenter,
  deleteCenter, getCenterStats, getNearbyCenter, assignStaff,
} = require('../controllers/healthCenterController');

const { protect, requireMinRole, optionalAuth } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { createCenterValidator, paginationValidator, mongoIdParam } = require('../middleware/validator');

// Nearby search is public (with optional auth)
router.get('/nearby', optionalAuth, getNearbyCenter);

// All other routes require auth
router.use(protect);

router.get('/', paginationValidator, getAllCenters);
router.post('/', requireMinRole(ROLES.DISTRICT_ADMIN), createCenterValidator, createCenter);

router
  .route('/:id')
  .get(mongoIdParam(), getCenterById)
  .put(requireMinRole(ROLES.DISTRICT_ADMIN), mongoIdParam(), updateCenter)
  .delete(requireMinRole(ROLES.SUPER_ADMIN), mongoIdParam(), deleteCenter);

router.get('/:id/stats', mongoIdParam(), getCenterStats);
router.post('/:id/staff', requireMinRole(ROLES.DISTRICT_ADMIN), mongoIdParam(), assignStaff);

module.exports = router;
