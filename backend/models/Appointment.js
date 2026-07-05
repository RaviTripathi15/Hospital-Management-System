'use strict';

const mongoose = require('mongoose');
const { APPOINTMENT_TYPES, APPOINTMENT_STATUS } = require('../config/constants');

const PrescriptionItemSchema = new mongoose.Schema(
  {
    medicine: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    duration: { type: String, trim: true },
    route: { type: String, trim: true, default: 'Oral' },
    notes: { type: String, trim: true },
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', default: null },
  },
  { _id: true }
);

const AppointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required.'],
    },
    healthCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthCenter',
      required: [true, 'Health centre is required.'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    date: {
      type: Date,
      required: [true, 'Appointment date is required.'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required.'],
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(APPOINTMENT_TYPES),
      required: [true, 'Appointment type is required.'],
      default: APPOINTMENT_TYPES.OPD,
    },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.SCHEDULED,
    },
    symptoms: [
      {
        type: String,
        trim: true,
      },
    ],
    diagnosis: {
      type: String,
      trim: true,
      default: null,
    },
    icdCode: {
      type: String,
      trim: true,
      default: null,
    },
    prescription: [PrescriptionItemSchema],
    vitals: {
      bloodPressure: { type: String },
      temperature: { type: Number },
      pulse: { type: Number },
      weight: { type: Number },
      height: { type: Number },
      oxygenSaturation: { type: Number },
    },
    labTests: [
      {
        testName: { type: String, trim: true },
        result: { type: String, trim: true },
        date: { type: Date },
      },
    ],
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    tokenNumber: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
AppointmentSchema.index({ patient: 1 });
AppointmentSchema.index({ healthCenter: 1 });
AppointmentSchema.index({ doctor: 1 });
AppointmentSchema.index({ date: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ type: 1 });
AppointmentSchema.index({ healthCenter: 1, date: 1 });
AppointmentSchema.index({ doctor: 1, date: 1, status: 1 });
AppointmentSchema.index({ createdAt: -1 });

// ─── Virtual ──────────────────────────────────────────────────────────────────
AppointmentSchema.virtual('duration').get(function () {
  if (!this.checkedInAt || !this.completedAt) return null;
  return Math.round((this.completedAt - this.checkedInAt) / (1000 * 60)); // minutes
});

// ─── Pre-save: Set isEmergency flag ──────────────────────────────────────────
AppointmentSchema.pre('save', function (next) {
  if (this.type === 'emergency') this.isEmergency = true;
  next();
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
