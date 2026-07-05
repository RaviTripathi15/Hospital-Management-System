'use strict';

const express = require('express');
const router = express.Router();

const {
  getAllItems, getItemById, addItem, updateItem, deleteItem,
  updateStock, getLowStockItems, getExpiringItems, getInventoryByCenter, bulkUpdate,
} = require('../controllers/inventoryController');

const { protect, requireMinRole, requireAnyRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { createInventoryValidator, updateStockValidator, paginationValidator, mongoIdParam } = require('../middleware/validator');

router.use(protect);

router.get('/low-stock', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), paginationValidator, getLowStockItems);
router.get('/expiring', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), paginationValidator, getExpiringItems);
router.get('/center/:centerId', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), paginationValidator, getInventoryByCenter);
router.patch('/bulk-update', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), bulkUpdate);

router.get('/', requireMinRole(ROLES.STAFF), paginationValidator, getAllItems);
router.post('/', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), createInventoryValidator, addItem);

router
  .route('/:id')
  .get(requireMinRole(ROLES.STAFF), mongoIdParam(), getItemById)
  .put(requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), mongoIdParam(), updateItem)
  .delete(requireMinRole(ROLES.DISTRICT_ADMIN), mongoIdParam(), deleteItem);

router.patch('/:id/stock', requireAnyRole(ROLES.STAFF, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN), mongoIdParam(), updateStockValidator, updateStock);

module.exports = router;
