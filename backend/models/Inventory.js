'use strict';

const mongoose = require('mongoose');
const { INVENTORY_CATEGORIES } = require('../config/constants');

const RestockHistorySchema = new mongoose.Schema(
  {
    quantity: { type: Number, required: true },
    operation: { type: String, enum: ['add', 'subtract', 'set'], default: 'add' },
    batchNumber: { type: String, trim: true },
    expiryDate: { type: Date, default: null },
    supplier: { type: String, trim: true },
    unitCost: { type: Number, min: 0, default: 0 },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
    stockAfter: { type: Number },
  },
  { timestamps: true }
);

const InventorySchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: [true, 'Item name is required.'],
      trim: true,
      maxlength: [200, 'Item name cannot exceed 200 characters.'],
    },
    genericName: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      required: [true, 'Category is required.'],
      enum: Object.values(INVENTORY_CATEGORIES),
    },
    itemCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    healthCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthCenter',
      required: [true, 'Health centre is required.'],
    },
    currentStock: {
      type: Number,
      required: [true, 'Current stock is required.'],
      min: [0, 'Stock cannot be negative.'],
      default: 0,
    },
    minStockLevel: {
      type: Number,
      required: [true, 'Minimum stock level is required.'],
      min: [0, 'Min stock level cannot be negative.'],
      default: 0,
    },
    maxStockLevel: {
      type: Number,
      min: [0, 'Max stock level cannot be negative.'],
      default: 1000,
    },
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required.'],
      trim: true,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    batchNumber: {
      type: String,
      trim: true,
      default: null,
    },
    supplier: {
      name: { type: String, trim: true },
      contact: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },
    unitCost: {
      type: Number,
      min: [0, 'Unit cost cannot be negative.'],
      default: 0,
    },
    storageConditions: {
      type: String,
      trim: true,
      default: 'Room temperature',
    },
    dailyUsage: {
      type: Number,
      min: [0, 'Daily usage cannot be negative.'],
      default: 0,
    },
    lastRestocked: {
      type: Date,
      default: null,
    },
    restockHistory: [RestockHistorySchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
InventorySchema.index({ healthCenter: 1 });
InventorySchema.index({ category: 1 });
InventorySchema.index({ itemCode: 1 });
InventorySchema.index({ healthCenter: 1, itemCode: 1 }, { unique: true, sparse: true });
InventorySchema.index({ expiryDate: 1 });
InventorySchema.index({ currentStock: 1 });
InventorySchema.index({ itemName: 'text', genericName: 'text' });

// ─── Virtuals ─────────────────────────────────────────────────────────────────
InventorySchema.virtual('isExpired').get(function () {
  if (!this.expiryDate) return false;
  return new Date() > new Date(this.expiryDate);
});

InventorySchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.minStockLevel;
});

InventorySchema.virtual('daysUntilExpiry').get(function () {
  if (!this.expiryDate) return null;
  const diff = new Date(this.expiryDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

InventorySchema.virtual('stockPercentage').get(function () {
  if (!this.maxStockLevel || this.maxStockLevel === 0) return 0;
  return Math.round((this.currentStock / this.maxStockLevel) * 100);
});

// ─── Pre-save: Auto-generate itemCode if missing ──────────────────────────────
InventorySchema.pre('save', function (next) {
  if (!this.itemCode) {
    const prefix = this.category.toUpperCase().substring(0, 3);
    const suffix = Date.now().toString(36).toUpperCase();
    this.itemCode = `${prefix}-${suffix}`;
  }
  next();
});

module.exports = mongoose.model('Inventory', InventorySchema);
