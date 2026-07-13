'use strict';

const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

const RoleRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required.'],
    },
    requestedRole: {
      type: String,
      enum: Object.values(ROLES),
      required: [true, 'Requested role is required.'],
    },
    employeeId: {
      type: String,
      trim: true,
      default: null,
    },
    hospitalCode: {
      type: String,
      trim: true,
      default: null,
    },
    verificationDoc: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminFeedback: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RoleRequestSchema.index({ user: 1 });
RoleRequestSchema.index({ status: 1 });
RoleRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RoleRequest', RoleRequestSchema);
