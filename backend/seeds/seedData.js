'use strict';

/**
 * Seed script — populates the database with realistic sample data.
 * Run: node seeds/seedData.js
 * Clear: node seeds/seedData.js --clear
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

if (process.env.NODE_ENV !== 'production') {
  const dns = require('dns');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('../models/User');
const HealthCenter = require('../models/HealthCenter');
const Patient = require('../models/Patient');
const Inventory = require('../models/Inventory');
const Appointment = require('../models/Appointment');
const Report = require('../models/Report');
const Notification = require('../models/Notification');

const { ROLES, CENTER_TYPES, GENDERS, BLOOD_GROUPS, APPOINTMENT_TYPES, APPOINTMENT_STATUS,
  INVENTORY_CATEGORIES, REPORT_TYPES, REPORT_STATUS, OPERATIONAL_STATUS, NOTIFICATION_TYPES } = require('../config/constants');
const logger = require('../config/logger');

// ─── Sample Data Definitions ──────────────────────────────────────────────────

const DISTRICTS_SAMPLE = ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur'];

const facilities = ['OPD', 'Labour Room', 'Vaccination', 'Emergency', 'Pharmacy', 'Lab', 'Dental', 'Eye Clinic', 'Physiotherapy'];

const medicines = [
  { name: 'Paracetamol 500mg', generic: 'Paracetamol', category: INVENTORY_CATEGORIES.MEDICINE, unit: 'tablets' },
  { name: 'Amoxicillin 250mg', generic: 'Amoxicillin', category: INVENTORY_CATEGORIES.MEDICINE, unit: 'capsules' },
  { name: 'Oral Rehydration Salts (ORS)', generic: 'ORS', category: INVENTORY_CATEGORIES.MEDICINE, unit: 'sachets' },
  { name: 'Metformin 500mg', generic: 'Metformin', category: INVENTORY_CATEGORIES.MEDICINE, unit: 'tablets' },
  { name: 'Atenolol 50mg', generic: 'Atenolol', category: INVENTORY_CATEGORIES.MEDICINE, unit: 'tablets' },
  { name: 'Iron & Folic Acid', generic: 'IFA', category: INVENTORY_CATEGORIES.MEDICINE, unit: 'tablets' },
  { name: 'Cotrimoxazole 480mg', generic: 'Cotrimoxazole', category: INVENTORY_CATEGORIES.MEDICINE, unit: 'tablets' },
  { name: 'Chloroquine 500mg', generic: 'Chloroquine', category: INVENTORY_CATEGORIES.MEDICINE, unit: 'tablets' },
  { name: 'Disposable Gloves (Box)', generic: null, category: INVENTORY_CATEGORIES.CONSUMABLE, unit: 'boxes' },
  { name: 'Surgical Masks', generic: null, category: INVENTORY_CATEGORIES.CONSUMABLE, unit: 'pieces' },
  { name: 'Stethoscope', generic: null, category: INVENTORY_CATEGORIES.EQUIPMENT, unit: 'units' },
  { name: 'Blood Pressure Monitor', generic: null, category: INVENTORY_CATEGORIES.EQUIPMENT, unit: 'units' },
  { name: 'BCG Vaccine', generic: null, category: INVENTORY_CATEGORIES.VACCINE, unit: 'vials' },
  { name: 'OPV (Oral Polio Vaccine)', generic: null, category: INVENTORY_CATEGORIES.VACCINE, unit: 'vials' },
];

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const firstNames = ['Rahul', 'Priya', 'Amit', 'Sunita', 'Rajesh', 'Kavita', 'Mohan', 'Geeta', 'Deepak', 'Anita',
  'Sandeep', 'Rekha', 'Vijay', 'Meena', 'Suresh', 'Pooja', 'Arun', 'Shobha', 'Naresh', 'Usha'];
const lastNames = ['Kumar', 'Sharma', 'Singh', 'Yadav', 'Gupta', 'Verma', 'Tiwari', 'Mishra', 'Jha', 'Pathak'];

const randomName = () => `${randomFrom(firstNames)} ${randomFrom(lastNames)}`;
const randomPhone = () => `+91${randomInt(7000000000, 9999999999)}`;
const randomEmail = (name) => `${name.toLowerCase().replace(/\s+/g, '.')}${randomInt(10, 99)}@example.com`;

// ─── Main Seed Function ───────────────────────────────────────────────────────
const seedDatabase = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/health_platform';

  console.log("Seeding MONGO_URI:", MONGO_URI);
  await mongoose.connect(MONGO_URI, { family: 4 });
  logger.info('Connected to MongoDB for seeding.');

  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear') || args.includes('-c');

  if (shouldClear) {
    logger.info('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      HealthCenter.deleteMany({}),
      Patient.deleteMany({}),
      Inventory.deleteMany({}),
      Appointment.deleteMany({}),
      Report.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    logger.info('All collections cleared.');
  }

  // ─── 1. Users ─────────────────────────────────────────────────────────────
  logger.info('Seeding users...');

  const hashedPassword = await bcrypt.hash('Admin@1234', 12);

  const superAdmin = await User.create({
    name: 'System Administrator',
    email: 'superadmin@healthplatform.gov',
    password: 'Admin@1234',
    role: ROLES.SUPER_ADMIN,
    phone: '+911234567890',
    isActive: true,
  });

  const districtAdmins = [];
  for (const district of DISTRICTS_SAMPLE) {
    const admin = await User.create({
      name: `${district} District Admin`,
      email: `admin.${district.toLowerCase()}@healthplatform.gov`,
      password: 'Admin@1234',
      role: ROLES.DISTRICT_ADMIN,
      district,
      phone: randomPhone(),
      isActive: true,
    });
    districtAdmins.push(admin);
  }

  // ─── 2. Health Centres ────────────────────────────────────────────────────
  logger.info('Seeding health centres...');

  const centres = [];
  for (let i = 0; i < DISTRICTS_SAMPLE.length; i++) {
    const district = DISTRICTS_SAMPLE[i];

    // 2 centres per district
    for (let j = 0; j < 2; j++) {
      const type = j === 0 ? CENTER_TYPES.PHC : CENTER_TYPES.CHC;
      const blockName = `Block ${String.fromCharCode(65 + j)}`;

      const staffUser = await User.create({
        name: `Dr. ${randomName()}`,
        email: randomEmail(`Dr ${randomName()}`),
        password: 'Staff@1234',
        role: ROLES.STAFF,
        district,
        phone: randomPhone(),
        isActive: true,
      });

      const capacity = type === CENTER_TYPES.CHC ? randomInt(20, 50) : randomInt(5, 15);

      const center = await HealthCenter.create({
        name: `${blockName} ${type} ${district}`,
        type,
        district,
        block: blockName,
        village: `Village ${randomInt(1, 50)}`,
        address: {
          street: `NH-${randomInt(1, 99)} Road`,
          city: district,
          state: 'Bihar',
          pincode: `80${randomInt(1000, 9999)}`,
        },
        coordinates: {
          lat: 25.0 + Math.random() * 2.5,
          lng: 85.0 + Math.random() * 2.5,
        },
        contactNumber: randomPhone(),
        email: `${type.toLowerCase()}.${blockName.toLowerCase().replace(/\s/g, '')}@health.bihar.gov`,
        inCharge: staffUser._id,
        staff: [staffUser._id],
        facilities: facilities.slice(0, randomInt(3, 7)),
        bedCapacity: capacity,
        totalBeds: capacity,
        availableBeds: capacity,
        operationalStatus: OPERATIONAL_STATUS.ACTIVE,
        registrationNumber: `BHR-${district.substring(0, 3).toUpperCase()}-${String(j + 1).padStart(4, '0')}`,
        catchmentPopulation: randomInt(5000, 50000),
        isActive: true,
      });

      // Update staff user
      await User.findByIdAndUpdate(staffUser._id, { healthCenter: center._id });

      centres.push(center);
    }
  }

  // ─── 3. Additional Staff ──────────────────────────────────────────────────
  logger.info('Seeding additional staff...');
  const staffUsers = [];
  for (const center of centres) {
    for (let s = 0; s < 2; s++) {
      const staff = await User.create({
        name: randomName(),
        email: randomEmail(randomName()),
        password: 'Staff@1234',
        role: ROLES.STAFF,
        healthCenter: center._id,
        district: center.district,
        phone: randomPhone(),
        isActive: true,
      });
      staffUsers.push(staff);
      await HealthCenter.findByIdAndUpdate(center._id, { $push: { staff: staff._id } });
    }
  }

  // ─── 4. Patients ──────────────────────────────────────────────────────────
  logger.info('Seeding patients...');
  const patients = [];
  const allStaff = await User.find({ role: ROLES.STAFF });

  for (const center of centres) {
    const centerStaff = allStaff.find((s) => s.healthCenter?.toString() === center._id.toString());

    for (let p = 0; p < 10; p++) {
      const gender = randomFrom(Object.values(GENDERS));
      const dob = randomDate(new Date(1950, 0, 1), new Date(2010, 0, 1));

      const patientIdPrefix = `${center.district.substring(0, 3).toUpperCase()}-${center.block.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}`;
      const patientCount = await Patient.countDocuments({ patientId: { $regex: `^${patientIdPrefix}` } });
      const patientId = `${patientIdPrefix}-${String(patientCount + 1).padStart(5, '0')}`;

      const patient = await Patient.create({
        patientId,
        name: randomName(),
        gender,
        dob,
        age: Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000)),
        phone: randomPhone(),
        bloodGroup: randomFrom(BLOOD_GROUPS),
        address: {
          village: `Village ${randomInt(1, 30)}`,
          block: center.block,
          district: center.district,
          state: 'Bihar',
          pincode: `80${randomInt(1000, 9999)}`,
        },
        healthCenter: center._id,
        registeredBy: centerStaff ? centerStaff._id : allStaff[0]._id,
        emergencyContact: {
          name: randomName(),
          relation: randomFrom(['Spouse', 'Parent', 'Sibling', 'Child']),
          phone: randomPhone(),
        },
        isActive: true,
      });
      patients.push(patient);
    }
  }

  // ─── 5. Inventory ─────────────────────────────────────────────────────────
  logger.info('Seeding inventory...');

  for (const center of centres) {
    for (const med of medicines) {
      const currentStock = randomInt(0, 500);
      const minStock = randomInt(10, 50);
      const expiryDate = randomDate(new Date(), new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000));

      // Generate unique itemCode
      const prefix = med.category.substring(0, 3).toUpperCase();
      const suffix = Date.now().toString(36).toUpperCase() + randomInt(100, 999);
      const itemCode = `${prefix}-${suffix}`;

      // Check if itemCode already exists for this centre, skip if so
      const existing = await Inventory.findOne({ healthCenter: center._id, itemCode });
      if (existing) continue;

      await Inventory.create({
        itemName: med.name,
        genericName: med.generic,
        category: med.category,
        itemCode,
        healthCenter: center._id,
        currentStock,
        minStockLevel: minStock,
        maxStockLevel: minStock * 20,
        unit: med.unit,
        expiryDate: med.category !== INVENTORY_CATEGORIES.EQUIPMENT ? expiryDate : null,
        batchNumber: `BATCH-${randomInt(10000, 99999)}`,
        supplier: { name: `Supplier ${randomInt(1, 10)} Ltd.` },
        unitCost: randomInt(1, 500),
        lastRestocked: randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
        isActive: true,
      });
    }
  }

  // ─── 6. Appointments ──────────────────────────────────────────────────────
  logger.info('Seeding appointments...');
  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00'];
  const symptoms = ['fever', 'cough', 'headache', 'body pain', 'vomiting', 'diarrhoea', 'chest pain'];

  for (const center of centres) {
    const centerPatients = patients.filter((p) => p.healthCenter.toString() === center._id.toString());
    const doctor = allStaff.find((s) => s.healthCenter?.toString() === center._id.toString());

    for (let a = 0; a < 5; a++) {
      const patient = randomFrom(centerPatients);
      const appointmentDate = randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      const status = randomFrom(Object.values(APPOINTMENT_STATUS));

      await Appointment.create({
        patient: patient._id,
        healthCenter: center._id,
        doctor: doctor ? doctor._id : allStaff[0]._id,
        date: appointmentDate,
        timeSlot: randomFrom(timeSlots),
        type: randomFrom(Object.values(APPOINTMENT_TYPES)),
        status,
        symptoms: [randomFrom(symptoms), randomFrom(symptoms)].filter((v, i, a) => a.indexOf(v) === i),
        diagnosis: status === APPOINTMENT_STATUS.COMPLETED ? 'Common viral infection' : null,
        notes: 'Follow-up in 1 week if symptoms persist.',
        createdBy: doctor ? doctor._id : allStaff[0]._id,
        tokenNumber: a + 1,
      });
    }
  }

  // ─── 7. Reports ───────────────────────────────────────────────────────────
  logger.info('Seeding reports...');

  for (const center of centres) {
    const startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();

    const inCharge = await User.findById(center.inCharge);

    await Report.create({
      healthCenter: center._id,
      reportType: REPORT_TYPES.MONTHLY,
      period: { startDate, endDate },
      metrics: {
        patientsServed: randomInt(50, 300),
        appointmentsCompleted: randomInt(40, 250),
        appointmentsCancelled: randomInt(5, 30),
        newPatients: randomInt(10, 50),
        emergencyCases: randomInt(2, 20),
        inventoryItemsUsed: randomInt(100, 1000),
        malePatientsServed: randomInt(20, 150),
        femalePatientsServed: randomInt(20, 150),
        vaccinationsGiven: randomInt(5, 50),
        antenatalVisits: randomInt(3, 30),
      },
      submittedBy: inCharge ? inCharge._id : allStaff[0]._id,
      submittedAt: new Date(),
      status: randomFrom([REPORT_STATUS.DRAFT, REPORT_STATUS.SUBMITTED]),
      isAutoGenerated: false,
    });
  }

  // ─── 8. Notifications ─────────────────────────────────────────────────────
  logger.info('Seeding notifications...');

  for (const staff of allStaff.slice(0, 4)) {
    await Notification.create({
      recipient: staff._id,
      type: NOTIFICATION_TYPES.LOW_STOCK,
      title: 'Low Stock Alert',
      message: 'Paracetamol 500mg is running low at your centre.',
      isRead: false,
      priority: 'high',
    });

    await Notification.create({
      recipient: staff._id,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Welcome to Health Platform',
      message: 'Your account has been set up. Please complete your profile.',
      isRead: true,
      priority: 'low',
    });
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  const counts = {
    users: await User.countDocuments(),
    healthCentres: await HealthCenter.countDocuments(),
    patients: await Patient.countDocuments(),
    inventoryItems: await Inventory.countDocuments(),
    appointments: await Appointment.countDocuments(),
    reports: await Report.countDocuments(),
    notifications: await Notification.countDocuments(),
  };

  logger.info('Seed data summary:');
  Object.entries(counts).forEach(([k, v]) => logger.info(`  ${k}: ${v}`));

  logger.info('\n=== Default Credentials ===');
  logger.info('Super Admin:      superadmin@healthplatform.gov  /  Admin@1234');
  logger.info('District Admin:   admin.patna@healthplatform.gov  /  Admin@1234');
  logger.info('Staff:            (see email in database)  /  Staff@1234');
  logger.info('===========================\n');

  await mongoose.connection.close();
  logger.info('Seeding complete. Connection closed.');
  process.exit(0);
};

seedDatabase().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
