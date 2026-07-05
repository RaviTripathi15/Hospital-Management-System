'use strict';

// ─── User Roles ───────────────────────────────────────────────────────────────
const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  DISTRICT_ADMIN: 'district_admin',
  STAFF: 'staff',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  CITIZEN: 'citizen',
});

// Role hierarchy — higher index = more privilege
const ROLE_HIERARCHY = [ROLES.CITIZEN, ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN];

// ─── Health Centre Types ──────────────────────────────────────────────────────
const CENTER_TYPES = Object.freeze({
  PHC: 'PHC',  // Primary Health Centre
  CHC: 'CHC',  // Community Health Centre
  DH: 'DH',   // District Hospital
  SHC: 'SHC', // Sub-Health Centre
});

// ─── Operational Status ───────────────────────────────────────────────────────
const OPERATIONAL_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  UNDER_MAINTENANCE: 'under_maintenance',
  CLOSED: 'closed',
});

// ─── Appointment Types & Status ───────────────────────────────────────────────
const APPOINTMENT_TYPES = Object.freeze({
  OPD: 'OPD',
  EMERGENCY: 'emergency',
  FOLLOW_UP: 'follow-up',
  ANTENATAL: 'antenatal',
  VACCINATION: 'vaccination',
});

const APPOINTMENT_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
  IN_PROGRESS: 'in-progress',
});

// ─── Inventory Categories ─────────────────────────────────────────────────────
const INVENTORY_CATEGORIES = Object.freeze({
  MEDICINE: 'medicine',
  EQUIPMENT: 'equipment',
  CONSUMABLE: 'consumable',
  VACCINE: 'vaccine',
  REAGENT: 'reagent',
});

// ─── Report Types & Status ────────────────────────────────────────────────────
const REPORT_TYPES = Object.freeze({
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual',
  OUTBREAK: 'outbreak',
});

const REPORT_STATUS = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

// ─── Notification Types ───────────────────────────────────────────────────────
const NOTIFICATION_TYPES = Object.freeze({
  LOW_STOCK: 'low_stock',
  EXPIRY_ALERT: 'expiry_alert',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  REPORT_DUE: 'report_due',
  REPORT_APPROVED: 'report_approved',
  NEW_PATIENT: 'new_patient',
  SYSTEM: 'system',
  OUTBREAK_ALERT: 'outbreak_alert',
  BED_ALERT: 'bed_alert',
});

// ─── Gender ───────────────────────────────────────────────────────────────────
const GENDERS = Object.freeze({
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
});

// ─── Blood Groups ─────────────────────────────────────────────────────────────
const BLOOD_GROUPS = Object.freeze(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

// ─── Thresholds ───────────────────────────────────────────────────────────────
const THRESHOLDS = Object.freeze({
  LOW_STOCK_DAYS: parseInt(process.env.LOW_STOCK_THRESHOLD_DAYS, 10) || 30,
  EXPIRY_ALERT_DAYS: parseInt(process.env.EXPIRY_ALERT_DAYS, 10) || 90,
  UNDERPERFORMANCE_THRESHOLD: 0.7, // 70% of district average
  MIN_STAFF_PATIENT_RATIO: 0.05,   // 1 staff per 20 patients
  MOVING_AVERAGE_WINDOW: 7,        // 7-day moving average
  FORECAST_DAYS: 30,
});

// ─── Pagination Defaults ──────────────────────────────────────────────────────
const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: parseInt(process.env.PAGINATION_DEFAULT_LIMIT, 10) || 10,
  MAX_LIMIT: parseInt(process.env.PAGINATION_MAX_LIMIT, 10) || 100,
});

// ─── HTTP Status Codes ────────────────────────────────────────────────────────
const HTTP = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
});

// ─── Districts (India-specific example) ──────────────────────────────────────
const DISTRICTS = Object.freeze([
  'Arwal', 'Aurangabad', 'Bhagalpur', 'Bhojpur', 'Buxar',
  'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui',
  'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj',
  'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur',
  'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas',
  'Saharsa', 'Samastipur', 'Saran', 'Sheikhpura', 'Sheohar',
  'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran',
]);

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  CENTER_TYPES,
  OPERATIONAL_STATUS,
  APPOINTMENT_TYPES,
  APPOINTMENT_STATUS,
  INVENTORY_CATEGORIES,
  REPORT_TYPES,
  REPORT_STATUS,
  NOTIFICATION_TYPES,
  GENDERS,
  BLOOD_GROUPS,
  THRESHOLDS,
  PAGINATION,
  HTTP,
  DISTRICTS,
};
