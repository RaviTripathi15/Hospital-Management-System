export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  DISTRICT_ADMIN: 'district_admin',
  PHC_ADMIN: 'phc_admin',
  CHC_ADMIN: 'chc_admin',
  STAFF: 'staff',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  CITIZEN: 'citizen',
}

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  PATIENT_ADD: '/patients/add',
  INVENTORY: '/inventory',
  INVENTORY_ADD: '/inventory/add',
  APPOINTMENTS: '/appointments',
  APPOINTMENT_BOOK: '/appointments/book',
  ATTENDANCE: '/attendance',
  REPORTS: '/reports',
  REPORT_CREATE: '/reports/create',
  ANALYTICS_DISTRICT: '/analytics/district',
  ANALYTICS_NATIONAL: '/analytics/national',
  AI: '/ai',
  ADMIN_CENTERS: '/admin/centers',
  ADMIN_CENTERS_ADD: '/admin/centers/add',
  ADMIN_USERS: '/admin/users',
  ADMIN_SETTINGS: '/admin/settings',
  PROFILE: '/profile',
  UNAUTHORIZED: '/unauthorized',
}

export const STATUS_COLORS = {
  active: 'green',
  inactive: 'gray',
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
  draft: 'gray',
  submitted: 'blue',
  scheduled: 'blue',
  confirmed: 'green',
  completed: 'green',
  cancelled: 'red',
  no_show: 'orange',
  low: 'yellow',
  normal: 'green',
  high: 'orange',
  critical: 'red',
  in_stock: 'green',
  low_stock: 'yellow',
  out_of_stock: 'red',
  expiring_soon: 'orange',
  expired: 'red',
}

export const CHART_COLORS = [
  '#3b82f6',
  '#14b8a6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#10b981',
  '#f97316',
  '#06b6d4',
  '#84cc16',
]

export const ITEMS_PER_PAGE = 10

export const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50, 100]

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const INVENTORY_CATEGORIES = [
  { value: 'medicine', label: 'Medicines' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'consumable', label: 'Consumables' },
  { value: 'vaccine', label: 'Vaccines' },
  { value: 'reagent', label: 'Reagents' },
]

export const CENTER_TYPES = [
  { value: 'PHC', label: 'Primary Health Center' },
  { value: 'CHC', label: 'Community Health Center' },
  { value: 'DH', label: 'District Hospital' },
  { value: 'SHC', label: 'Sub Center' },
]

export const APPOINTMENT_TYPES = [
  { value: 'new_consultation', label: 'New Consultation' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'emergency', label: 'Emergency' },
]

export const REPORT_PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
]

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
]

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
]

export const URGENCY_LEVELS = {
  critical: { label: 'Critical', color: 'red', days: 7 },
  high: { label: 'High', color: 'orange', days: 14 },
  medium: { label: 'Medium', color: 'yellow', days: 30 },
  low: { label: 'Low', color: 'green', days: 60 },
}

export const PRIORITY_COLORS = {
  high: 'danger',
  medium: 'warning',
  low: 'success',
}
