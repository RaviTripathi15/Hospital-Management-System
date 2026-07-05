'use strict';

const mongoose = require('mongoose');

const FootfallSchema = new mongoose.Schema(
  {
    healthCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthCenter',
      required: [true, 'Health center ID is required.'],
    },
    patientCount: {
      type: Number,
      required: [true, 'Patient count is required.'],
      min: [0, 'Patient count cannot be negative.'],
      default: 0,
    },
    department: {
      type: String,
      required: [true, 'Department name is required.'],
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for rapid analytical queries
FootfallSchema.index({ healthCenter: 1 });
FootfallSchema.index({ department: 1 });
FootfallSchema.index({ timestamp: -1 });
FootfallSchema.index({ healthCenter: 1, department: 1, timestamp: -1 });

module.exports = mongoose.model('Footfall', FootfallSchema);
