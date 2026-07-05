'use strict';

const mongoose = require('mongoose');
const { CENTER_TYPES, OPERATIONAL_STATUS } = require('../config/constants');

const HealthCenterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Health centre name is required.'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters.'],
    },
    type: {
      type: String,
      enum: Object.values(CENTER_TYPES),
      required: [true, 'Centre type is required.'],
    },
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required.'],
      trim: true,
    },
    block: {
      type: String,
      required: [true, 'Block is required.'],
      trim: true,
    },
    village: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true, default: 'Bihar' },
      pincode: { type: String, trim: true },
    },
    coordinates: {
      lat: {
        type: Number,
        min: [-90, 'Latitude must be -90 to 90.'],
        max: [90, 'Latitude must be -90 to 90.'],
        default: null,
      },
      lng: {
        type: Number,
        min: [-180, 'Longitude must be -180 to 180.'],
        max: [180, 'Longitude must be -180 to 180.'],
        default: null,
      },
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required.'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email.'],
      default: null,
    },
    inCharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    staff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    facilities: [
      {
        type: String,
        trim: true,
      },
    ],
    bedCapacity: {
      type: Number,
      min: [0, 'Bed capacity cannot be negative.'],
      default: 0,
    },
    totalBeds: {
      type: Number,
      min: [0, 'Total beds cannot be negative.'],
      default: 0,
    },
    availableBeds: {
      type: Number,
      min: [0, 'Available beds cannot be negative.'],
      default: 0,
    },
    doctorCount: {
      type: Number,
      min: [0, 'Doctor count cannot be negative.'],
      default: 0,
    },
    staffCount: {
      type: Number,
      min: [0, 'Staff count cannot be negative.'],
      default: 0,
    },
    operationalStatus: {
      type: String,
      enum: Object.values(OPERATIONAL_STATUS),
      default: OPERATIONAL_STATUS.ACTIVE,
    },
    // Catchment population
    catchmentPopulation: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Operating hours
    operatingHours: {
      weekdays: { type: String, default: '8:00 AM - 4:00 PM' },
      saturday: { type: String, default: '8:00 AM - 2:00 PM' },
      sunday: { type: String, default: 'Closed' },
    },
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
HealthCenterSchema.index({ district: 1 });
HealthCenterSchema.index({ block: 1 });
HealthCenterSchema.index({ type: 1 });
HealthCenterSchema.index({ operationalStatus: 1 });
HealthCenterSchema.index({ isActive: 1 });
HealthCenterSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });
HealthCenterSchema.index({ name: 'text', district: 'text', block: 'text' });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

HealthCenterSchema.virtual('fullAddress').get(function () {
  const a = this.address || {};
  return [a.street, a.city, this.block, this.district, a.state, a.pincode]
    .filter(Boolean)
    .join(', ');
});

module.exports = mongoose.model('HealthCenter', HealthCenterSchema);
