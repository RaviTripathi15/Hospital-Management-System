'use strict';

const Inventory = require('../models/Inventory');
const HealthCenter = require('../models/HealthCenter');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');
const { HTTP, ROLES, NOTIFICATION_TYPES, THRESHOLDS } = require('../config/constants');

// ─── @route GET /api/v1/inventory ────────────────────────────────────────────
exports.getAllItems = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = await buildInventoryFilter(req);

  const [items, total] = await Promise.all([
    Inventory.find(filter)
      .populate('healthCenter', 'name district')
      .sort({ itemName: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Inventory.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(paginated(items, { page, limit, total }, 'Inventory retrieved.'));
});

// ─── @route GET /api/v1/inventory/:id ────────────────────────────────────────
exports.getItemById = asyncHandler(async (req, res, next) => {
  const item = await Inventory.findById(req.params.id)
    .populate('healthCenter', 'name district type')
    .populate('restockHistory.performedBy', 'name');

  if (!item) return next(new AppError('Inventory item not found.', HTTP.NOT_FOUND));

  // Access checks
  if (req.user.role === ROLES.STAFF && item.healthCenter?._id?.toString() !== req.user.healthCenter?.toString()) {
    return next(new AppError('Access denied. You can only view inventory of your health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && item.healthCenter?.district !== req.user.district) {
    return next(new AppError('Access denied. You can only view inventory in your district.', HTTP.FORBIDDEN));
  }

  return res.status(HTTP.OK).json(success(item, 'Item retrieved.'));
});

// ─── @route POST /api/v1/inventory ───────────────────────────────────────────
exports.addItem = asyncHandler(async (req, res, next) => {
  const { healthCenter: centerId, itemCode } = req.body;

  const center = await HealthCenter.findById(centerId);
  if (!center) return next(new AppError('Health centre not found.', HTTP.NOT_FOUND));

  // Access checks
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== centerId) {
    return next(new AppError('You can only add inventory items to your health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && center.district !== req.user.district) {
    return next(new AppError('You can only add inventory items to health centres in your district.', HTTP.FORBIDDEN));
  }

  // Prevent duplicate itemCode per centre
  if (itemCode) {
    const existing = await Inventory.findOne({ healthCenter: centerId, itemCode });
    if (existing) return next(new AppError('Item code already exists at this centre.', HTTP.CONFLICT));
  }

  const item = await Inventory.create({
    ...req.body,
    lastRestocked: req.body.currentStock > 0 ? new Date() : null,
  });

  return res.status(HTTP.CREATED).json(success(item, 'Inventory item added.'));
});

// ─── @route PUT /api/v1/inventory/:id ────────────────────────────────────────
exports.updateItem = asyncHandler(async (req, res, next) => {
  const item = await Inventory.findById(req.params.id).populate('healthCenter');
  if (!item) return next(new AppError('Inventory item not found.', HTTP.NOT_FOUND));

  // Access checks
  if (req.user.role === ROLES.STAFF && item.healthCenter?._id?.toString() !== req.user.healthCenter?.toString()) {
    return next(new AppError('You can only update inventory items at your health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && item.healthCenter?.district !== req.user.district) {
    return next(new AppError('You can only update inventory items in your district.', HTTP.FORBIDDEN));
  }

  const disallowed = ['healthCenter', 'itemCode', 'restockHistory'];
  disallowed.forEach((f) => delete req.body[f]);

  const updated = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return res.status(HTTP.OK).json(success(updated, 'Item updated.'));
});

// ─── @route DELETE /api/v1/inventory/:id ─────────────────────────────────────
exports.deleteItem = asyncHandler(async (req, res, next) => {
  const item = await Inventory.findById(req.params.id).populate('healthCenter');
  if (!item) return next(new AppError('Inventory item not found.', HTTP.NOT_FOUND));

  // Access check for district admins
  if (req.user.role === ROLES.DISTRICT_ADMIN && item.healthCenter?.district !== req.user.district) {
    return next(new AppError('You can only delete inventory items in your district.', HTTP.FORBIDDEN));
  }

  await Inventory.findByIdAndUpdate(req.params.id, { isActive: false });
  return res.status(HTTP.OK).json(success(null, 'Item deactivated.'));
});

// ─── @route PATCH /api/v1/inventory/:id/stock ────────────────────────────────
exports.updateStock = asyncHandler(async (req, res, next) => {
  const { quantity, operation, batchNumber, expiryDate, supplier, unitCost, notes } = req.body;
  const qty = parseInt(quantity, 10);

  const item = await Inventory.findById(req.params.id).populate('healthCenter');
  if (!item) return next(new AppError('Item not found.', HTTP.NOT_FOUND));

  // Access checks
  if (req.user.role === ROLES.STAFF && item.healthCenter?._id?.toString() !== req.user.healthCenter?.toString()) {
    return next(new AppError('You can only update stock at your health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN && item.healthCenter?.district !== req.user.district) {
    return next(new AppError('You can only update stock in your district.', HTTP.FORBIDDEN));
  }

  let newStock;
  if (operation === 'add') newStock = item.currentStock + qty;
  else if (operation === 'subtract') newStock = item.currentStock - qty;
  else if (operation === 'set') newStock = qty;
  else return next(new AppError('Invalid operation.', HTTP.BAD_REQUEST));

  if (newStock < 0) return next(new AppError('Stock cannot go below zero.', HTTP.BAD_REQUEST));

  const historyEntry = {
    quantity: qty,
    operation,
    batchNumber,
    expiryDate,
    supplier,
    unitCost,
    notes,
    performedBy: req.user._id,
    stockAfter: newStock,
  };

  item.currentStock = newStock;
  item.restockHistory.push(historyEntry);
  if (operation === 'add') item.lastRestocked = new Date();
  if (expiryDate) item.expiryDate = expiryDate;
  if (batchNumber) item.batchNumber = batchNumber;

  await item.save();

  // Check low stock alert
  if (newStock <= item.minStockLevel) {
    const center = item.healthCenter;
    if (center && center.inCharge) {
      await createNotification({
        recipient: center.inCharge,
        type: NOTIFICATION_TYPES.LOW_STOCK,
        title: 'Low Stock Alert',
        message: `${item.itemName} at ${center.name} is at low stock (${newStock} ${item.unit}).`,
        relatedEntity: { model: 'Inventory', id: item._id },
        priority: newStock === 0 ? 'critical' : 'high',
      });
    }
  }

  // Emit socket
  const io = req.app.get('io');
  if (io) {
    io.to(`center-${item.healthCenter._id}`).emit('inventory:stock_updated', {
      itemId: item._id,
      itemName: item.itemName,
      currentStock: newStock,
      isLowStock: newStock <= item.minStockLevel,
    });
  }

  return res.status(HTTP.OK).json(success(item, 'Stock updated.'));
});

// ─── @route GET /api/v1/inventory/low-stock ──────────────────────────────────
exports.getLowStockItems = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = await buildInventoryFilter(req);
  filter.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
  filter.isActive = true;

  const [items, total] = await Promise.all([
    Inventory.find(filter)
      .populate('healthCenter', 'name district')
      .sort({ currentStock: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Inventory.countDocuments(filter),
  ]);

  // Add days_until_stockout hint (stub — real forecast in aiService)
  const enriched = items.map((i) => ({
    ...i,
    urgency: i.currentStock === 0 ? 'critical' : 'warning',
  }));

  return res.status(HTTP.OK).json(paginated(enriched, { page, limit, total }, 'Low stock items retrieved.'));
});

// ─── @route GET /api/v1/inventory/expiring ───────────────────────────────────
exports.getExpiringItems = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || THRESHOLDS.EXPIRY_ALERT_DAYS;
  const alertDate = new Date();
  alertDate.setDate(alertDate.getDate() + days);

  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = await buildInventoryFilter(req);
  filter.expiryDate = { $lte: alertDate };
  filter.currentStock = { $gt: 0 };
  filter.isActive = true;

  const [items, total] = await Promise.all([
    Inventory.find(filter)
      .populate('healthCenter', 'name district')
      .sort({ expiryDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Inventory.countDocuments(filter),
  ]);

  const enriched = items.map((i) => {
    const daysLeft = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return { ...i, daysUntilExpiry: daysLeft, isExpired: daysLeft < 0 };
  });

  return res.status(HTTP.OK).json(paginated(enriched, { page, limit, total }, 'Expiring items retrieved.'));
});

// ─── @route GET /api/v1/inventory/center/:centerId ───────────────────────────
exports.getInventoryByCenter = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  // Access checks
  if (req.user.role === ROLES.STAFF && req.user.healthCenter?.toString() !== req.params.centerId) {
    return next(new AppError('Access denied. You can only view inventory of your health centre.', HTTP.FORBIDDEN));
  }
  if (req.user.role === ROLES.DISTRICT_ADMIN) {
    const center = await HealthCenter.findById(req.params.centerId);
    if (!center || center.district !== req.user.district) {
      return next(new AppError('Access denied. You can only view inventory in your district.', HTTP.FORBIDDEN));
    }
  }

  const filter = { healthCenter: req.params.centerId, isActive: true };

  const { category } = req.query;
  if (category) filter.category = category;

  const [items, total] = await Promise.all([
    Inventory.find(filter)
      .sort({ category: 1, itemName: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Inventory.countDocuments(filter),
  ]);

  return res.status(HTTP.OK).json(paginated(items, { page, limit, total }, 'Centre inventory retrieved.'));
});

// ─── @route PATCH /api/v1/inventory/bulk-update ──────────────────────────────
exports.bulkUpdate = asyncHandler(async (req, res, next) => {
  const { updates } = req.body; // [{ id, quantity, operation }]
  if (!Array.isArray(updates) || updates.length === 0) {
    return next(new AppError('Updates array is required.', HTTP.BAD_REQUEST));
  }

  const results = [];
  for (const u of updates) {
    const item = await Inventory.findById(u.id).populate('healthCenter');
    if (!item) { results.push({ id: u.id, error: 'Not found' }); continue; }

    // Access check for bulk update
    if (req.user.role === ROLES.STAFF && item.healthCenter?._id?.toString() !== req.user.healthCenter?.toString()) {
      results.push({ id: u.id, error: 'Access denied: different health centre' });
      continue;
    }
    if (req.user.role === ROLES.DISTRICT_ADMIN && item.healthCenter?.district !== req.user.district) {
      results.push({ id: u.id, error: 'Access denied: different district' });
      continue;
    }

    let newStock;
    if (u.operation === 'add') newStock = item.currentStock + u.quantity;
    else if (u.operation === 'subtract') newStock = item.currentStock - u.quantity;
    else newStock = u.quantity;

    if (newStock < 0) { results.push({ id: u.id, error: 'Stock cannot go below zero' }); continue; }

    item.currentStock = newStock;
    item.restockHistory.push({ quantity: u.quantity, operation: u.operation, performedBy: req.user._id, stockAfter: newStock });
    await item.save();
    results.push({ id: u.id, itemName: item.itemName, newStock });
  }

  return res.status(HTTP.OK).json(success(results, 'Bulk update completed.'));
});

// ─── Helper ───────────────────────────────────────────────────────────────────
const buildInventoryFilter = async (req) => {
  const filter = { isActive: true };
  const { healthCenter, category, search } = req.query;

  if (healthCenter) filter.healthCenter = healthCenter;
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { itemName: { $regex: search, $options: 'i' } },
      { genericName: { $regex: search, $options: 'i' } },
      { itemCode: { $regex: search, $options: 'i' } },
    ];
  }

  if (req.user.role === ROLES.STAFF && req.user.healthCenter) {
    filter.healthCenter = req.user.healthCenter;
  } else if (req.user.role === ROLES.DISTRICT_ADMIN) {
    const HealthCenter = require('../models/HealthCenter');
    const centers = await HealthCenter.find({ district: req.user.district, isActive: true }).select('_id');
    const centerIds = centers.map((c) => c._id);
    if (healthCenter) {
      if (!centerIds.map((id) => id.toString()).includes(healthCenter.toString())) {
        filter.healthCenter = null;
      }
    } else {
      filter.healthCenter = { $in: centerIds };
    }
  }

  return filter;
};
