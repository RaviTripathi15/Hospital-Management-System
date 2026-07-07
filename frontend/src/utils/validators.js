import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)'),
  confirmPassword: z.string(),
  role: z.string().optional(),
  centerCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const patientSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
  contact: z.string().regex(/^\d{10}$/, 'Contact must be a valid 10-digit number'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters').optional().or(z.literal('')),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional().or(z.literal('')),
  emergencyContactName: z.string().optional(),
  emergencyContact: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  currentMedications: z.string().optional(),
})

export const inventorySchema = z.object({
  itemName: z.string().min(2, 'Item name must be at least 2 characters').max(100),
  category: z.enum(['medicine', 'equipment', 'consumable', 'vaccine', 'reagent']),
  currentStock: z.preprocess((val) => Number(val), z.number().min(0, 'Current stock must be 0 or more')),
  minStockLevel: z.preprocess((val) => Number(val), z.number().min(0, 'Min stock level must be 0 or more')),
  maxStockLevel: z.preprocess((val) => (val === '' ? 1000 : Number(val)), z.number().min(0).optional()),
  dailyUsage: z.preprocess((val) => (val === '' ? 0 : Number(val)), z.number().min(0).optional()),
  unit: z.string().min(1, 'Unit is required'),
  expiryDate: z.string().optional().or(z.literal('')),
  batchNumber: z.string().optional().or(z.literal('')),
  supplierName: z.string().optional().or(z.literal('')),
  supplierContact: z.string().optional().or(z.literal('')),
  supplierEmail: z.string().email().optional().or(z.literal('')),
  unitCost: z.preprocess((val) => (val === '' ? 0 : Number(val)), z.number().min(0).optional()),
  storageConditions: z.string().optional().or(z.literal('')),
  healthCenter: z.string().min(1, 'Health center is required'),
})

export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required').optional(),
  doctorId: z.string().min(1, 'Doctor is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  type: z.enum(['new_consultation', 'follow_up', 'emergency']).default('new_consultation'),
  notes: z.string().optional(),
})

export const reportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  period: z.enum(['monthly', 'quarterly', 'annual']),
  periodDate: z.string().min(1, 'Period date is required'),
  metrics: z.object({
    patientsServed: z.number().min(0),
    appointmentsCount: z.number().min(0),
    inventoryUsed: z.number().min(0).optional(),
    stockAvailability: z.number().min(0).max(100).optional(),
    staffingLevel: z.number().min(0).optional(),
  }),
  challenges: z.string().optional(),
  recommendations: z.string().optional(),
})

export const healthCenterSchema = z.object({
  name: z.string().min(3, 'Center name must be at least 3 characters'),
  type: z.enum(['PHC', 'CHC', 'DH', 'SHC']),
  district: z.string().min(2, 'District is required'),
  block: z.string().min(2, 'Block is required'),
  address: z.string().min(5, 'Address is required'),
  contactNumber: z.string().min(7, 'Contact number is required'),
  email: z.string().email().optional().or(z.literal('')),
  totalBeds: z.preprocess((val) => Number(val), z.number().min(0, 'Total beds must be 0 or more')),
  availableBeds: z.preprocess((val) => Number(val), z.number().min(0, 'Available beds must be 0 or more')),
  doctorCount: z.preprocess((val) => Number(val), z.number().min(0, 'Doctor count must be 0 or more')),
  staffCount: z.preprocess((val) => Number(val), z.number().min(0, 'Staff count must be 0 or more')),
  operationalStatus: z.enum(['active', 'inactive', 'under_maintenance', 'closed']),
  latitude: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().min(-90).max(90).optional()),
  longitude: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().min(-180).max(180).optional()),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const stockUpdateSchema = z.object({
  adjustment: z.number().int('Must be a whole number'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  type: z.enum(['add', 'remove', 'set']).default('add'),
})
