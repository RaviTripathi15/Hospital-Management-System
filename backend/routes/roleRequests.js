'use strict';

const express = require('express');
const router = express.Router();

const {
  createRequest,
  getMyRequest,
  getRequests,
  approveRequest,
  rejectRequest,
} = require('../controllers/roleRequestController');

const { protect, requireMinRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { uploadVerificationDoc } = require('../middleware/upload');
const { mongoIdParam } = require('../middleware/validator');

// All routes require authentication
router.use(protect);

// User endpoints
router.post('/', uploadVerificationDoc, createRequest);
router.get('/me', getMyRequest);

// Administrator endpoints (District Admin or Super Admin)
router.get('/', requireMinRole(ROLES.DISTRICT_ADMIN), getRequests);
router.put('/:id/approve', requireMinRole(ROLES.DISTRICT_ADMIN), mongoIdParam(), approveRequest);
router.put('/:id/reject', requireMinRole(ROLES.DISTRICT_ADMIN), mongoIdParam(), rejectRequest);

module.exports = router;
