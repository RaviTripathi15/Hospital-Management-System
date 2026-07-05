'use strict';

const express = require('express');
const router = express.Router();

const {
  getAllPatients, getPatientById, registerPatient, updatePatient,
  getPatientHistory, searchPatient, getPatientsByCenter, addVisit,
} = require('../controllers/patientController');

const { protect, requireMinRole, requireAnyRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { createPatientValidator, paginationValidator, mongoIdParam } = require('../middleware/validator');

router.use(protect);

router.get('/search', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), searchPatient);
router.get('/center/:centerId', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), paginationValidator, getPatientsByCenter);

router.get('/', requireMinRole(ROLES.STAFF), paginationValidator, getAllPatients);
router.post('/', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), createPatientValidator, registerPatient);

router
  .route('/:id')
  .get(requireMinRole(ROLES.STAFF), mongoIdParam(), getPatientById)
  .put(requireMinRole(ROLES.STAFF), mongoIdParam(), updatePatient);

router.get('/:id/history', requireMinRole(ROLES.STAFF), mongoIdParam(), paginationValidator, getPatientHistory);
router.post('/:id/visit', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), mongoIdParam(), addVisit);

module.exports = router;
