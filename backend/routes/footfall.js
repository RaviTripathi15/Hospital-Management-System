'use strict';

const express = require('express');
const router = express.Router();

const {
  logFootfall,
  getFootfallStats,
  getPeakHours,
  getTrends,
} = require('../controllers/footfallController');

const { protect, requireMinRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// All endpoints require authentication
router.use(protect);

router.post('/', logFootfall);
router.get('/stats', getFootfallStats);
router.get('/peak-hours', getPeakHours);
router.get('/trends', getTrends);

module.exports = router;
