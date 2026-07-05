'use strict';

const express = require('express');
const router = express.Router();

const {
  getAllUsers, getUserById, createUser, updateUser,
  deleteUser, updateUserRole, getUsersByCenter,
} = require('../controllers/userController');

const { protect, requireMinRole, requireAnyRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { createUserValidator, updateUserValidator, paginationValidator, mongoIdParam } = require('../middleware/validator');
const { uploadProfilePic } = require('../middleware/upload');

// All routes require authentication
router.use(protect);

router.get('/', requireMinRole(ROLES.DISTRICT_ADMIN), paginationValidator, getAllUsers);
router.post('/', requireMinRole(ROLES.DISTRICT_ADMIN), createUserValidator, createUser);
router.get('/center/:centerId', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), getUsersByCenter);

router
  .route('/:id')
  .get(requireMinRole(ROLES.STAFF), mongoIdParam(), getUserById)
  .put(requireMinRole(ROLES.DISTRICT_ADMIN), mongoIdParam(), updateUserValidator, uploadProfilePic, updateUser)
  .delete(requireMinRole(ROLES.DISTRICT_ADMIN), mongoIdParam(), deleteUser);

router.put('/:id/role', requireMinRole(ROLES.DISTRICT_ADMIN), mongoIdParam(), updateUserRole);

module.exports = router;
