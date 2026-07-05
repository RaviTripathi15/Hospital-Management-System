'use strict';

const mongoose = require('mongoose');

const BedAllocationSchema = new mongoose.Schema(
  {
    healthCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthCenter',
      required: [true, 'Health center ID is required.'],
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required.'],
    },
    bedNumber: {
      type: String,
      required: [true, 'Bed number is required.'],
      trim: true,
    },
    wardName: {
      type: String,
      required: [true, 'Ward name is required.'],
      trim: true,
    },
    allocatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['allocated', 'released'],
      default: 'allocated',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
BedAllocationSchema.index({ healthCenter: 1 });
BedAllocationSchema.index({ patient: 1 });
BedAllocationSchema.index({ status: 1 });
BedAllocationSchema.index({ healthCenter: 1, status: 1 });

module.exports = mongoose.model('BedAllocation', BedAllocationSchema);
