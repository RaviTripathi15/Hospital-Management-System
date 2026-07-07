'use strict';

const mongoose = require('mongoose');
const { GENDERS, BLOOD_GROUPS, APPOINTMENT_TYPES } = require('../config/constants');

const MedicalVisitSchema = new mongoose.Schema(
  {
    visitDate: { type: Date, default: Date.now },
    appointmentType: { type: String, enum: Object.values(APPOINTMENT_TYPES), default: APPOINTMENT_TYPES.OPD },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    healthCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthCenter', default: null },
    symptoms: [{ type: String, trim: true }],
    diagnosis: { type: String, trim: true },
    prescription: [
      {
        medicine: { type: String, trim: true },
        dosage: { type: String, trim: true },
        duration: { type: String, trim: true },
        notes: { type: String, trim: true },
      },
    ],
    vitals: {
      bloodPressure: { type: String },
      temperature: { type: Number }, // °C
      pulse: { type: Number },       // bpm
      weight: { type: Number },      // kg
      height: { type: Number },      // cm
      oxygenSaturation: { type: Number }, // %
    },
    labTests: [
      {
        testName: { type: String, trim: true },
        result: { type: String, trim: true },
        referenceRange: { type: String, trim: true },
        date: { type: Date },
      },
    ],
    referredTo: { type: String, trim: true },
    followUpDate: { type: Date, default: null },
    notes: { type: String, trim: true },
  },
  { _id: true, timestamps: true }
);

const PatientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Patient name is required.'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters.'],
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative.'],
      max: [150, 'Age cannot exceed 150.'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required.'],
      enum: Object.values(GENDERS),
    },
    dob: {
      type: Date,
      default: null,
    },
    address: {
      street: { type: String, trim: true },
      village: { type: String, trim: true },
      block: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true, default: 'Bihar' },
      pincode: { type: String, trim: true },
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: null,
    },
    bloodGroup: {
      type: String,
      enum: [...BLOOD_GROUPS, null],
      default: null,
    },
    allergies: [
      {
        type: String,
        trim: true,
      },
    ],
    chronicConditions: [
      {
        type: String,
        trim: true,
      },
    ],
    emergencyContact: {
      name: { type: String, trim: true },
      relation: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    healthCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthCenter',
      required: [true, 'Health centre is required.'],
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicalHistory: [MedicalVisitSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    // Insurance / scheme
    insuranceScheme: {
      type: String,
      trim: true,
      default: null,
    },
    aadhaarNumber: {
      type: String,
      trim: true,
      select: false, // Sensitive — only select explicitly
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
// patientId has unique: true in schema, so no separate index needed
PatientSchema.index({ healthCenter: 1 });
PatientSchema.index({ registeredBy: 1 });
PatientSchema.index({ gender: 1 });
PatientSchema.index({ bloodGroup: 1 });
PatientSchema.index({ createdAt: -1 });
PatientSchema.index({ name: 'text', phone: 'text', patientId: 'text' });

// ─── Virtual ──────────────────────────────────────────────────────────────────
PatientSchema.virtual('calculatedAge').get(function () {
  if (!this.dob) return this.age;
  const today = new Date();
  const birth = new Date(this.dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

PatientSchema.virtual('visitCount').get(function () {
  return this.medicalHistory ? this.medicalHistory.length : 0;
});

module.exports = mongoose.model('Patient', PatientSchema);
