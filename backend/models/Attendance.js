'use strict';

const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor is required.'],
    },
    healthCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthCenter',
      required: [true, 'Health center is required.'],
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required.'],
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'half-day'],
      default: 'absent',
    },
    loginTime: {
      type: Date,
      default: null,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index({ doctor: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ healthCenter: 1, date: 1 });
AttendanceSchema.index({ status: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
