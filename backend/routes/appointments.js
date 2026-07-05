'use strict';

const express = require('express');
const router = express.Router();

const {
  getAllAppointments, getAppointmentById, createAppointment, updateAppointment,
  cancelAppointment, getAppointmentsByCenter, getAppointmentsByDoctor, getTodayAppointments,
} = require('../controllers/appointmentController');

const { protect, requireMinRole, requireAnyRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { createAppointmentValidator, paginationValidator, mongoIdParam } = require('../middleware/validator');

router.use(protect);

router.get('/today', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), getTodayAppointments);
router.get('/center/:centerId', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), paginationValidator, getAppointmentsByCenter);
router.get('/doctor/:doctorId', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), paginationValidator, getAppointmentsByDoctor);

router.get('/', requireMinRole(ROLES.STAFF), paginationValidator, getAllAppointments);
router.post('/', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), createAppointmentValidator, createAppointment);

router
  .route('/:id')
  .get(requireMinRole(ROLES.STAFF), mongoIdParam(), getAppointmentById)
  .put(requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), mongoIdParam(), updateAppointment);

router.patch('/:id/cancel', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), mongoIdParam(), cancelAppointment);

module.exports = router;
