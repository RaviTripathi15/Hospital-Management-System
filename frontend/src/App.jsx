import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

// Layouts
import MainLayout from '@/components/layout/MainLayout'
import AuthLayout from '@/components/layout/AuthLayout'

// Auth Pages
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'

// Dashboard Pages
import CitizenDashboard from '@/pages/dashboard/CitizenDashboard'
import StaffDashboard from '@/pages/dashboard/StaffDashboard'
import DistrictAdminDashboard from '@/pages/dashboard/DistrictAdminDashboard'
import SuperAdminDashboard from '@/pages/dashboard/SuperAdminDashboard'

// Patient Pages
import PatientList from '@/pages/patients/PatientList'
import PatientDetail from '@/pages/patients/PatientDetail'
import AddPatient from '@/pages/patients/AddPatient'

// Inventory Pages
import InventoryList from '@/pages/inventory/InventoryList'
import InventoryDetail from '@/pages/inventory/InventoryDetail'
import AddInventory from '@/pages/inventory/AddInventory'

// Appointment Pages
import AppointmentList from '@/pages/appointments/AppointmentList'
import AppointmentDetail from '@/pages/appointments/AppointmentDetail'
import BookAppointment from '@/pages/appointments/BookAppointment'

// Report Pages
import ReportList from '@/pages/reports/ReportList'
import ReportDetail from '@/pages/reports/ReportDetail'
import CreateReport from '@/pages/reports/CreateReport'

// Analytics Pages
import DistrictAnalytics from '@/pages/analytics/DistrictAnalytics'
import NationalAnalytics from '@/pages/analytics/NationalAnalytics'

// AI Page
import AIDashboard from '@/pages/ai/AIDashboard'

// Admin Pages
import HealthCenterList from '@/pages/admin/HealthCenterList'
import HealthCenterDetail from '@/pages/admin/HealthCenterDetail'
import AddHealthCenter from '@/pages/admin/AddHealthCenter'
import UserManagement from '@/pages/admin/UserManagement'
import SystemSettings from '@/pages/admin/SystemSettings'
import BedManagement from '@/pages/admin/BedManagement'
import RoleRequestsManager from '@/pages/admin/RoleRequestsManager'

// Profile
import UserProfile from '@/pages/profile/UserProfile'

// Attendance
import DoctorAttendance from '@/pages/attendance/DoctorAttendance'

// Error Pages
import NotFound from '@/pages/NotFound'
import Unauthorized from '@/pages/Unauthorized'

// Guards
import ProtectedRoute from '@/components/common/ProtectedRoute'

// Constants
import { ROLES } from '@/utils/constants'

function DashboardRouter() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  switch (user.role) {
    case ROLES.SUPER_ADMIN: return <SuperAdminDashboard />
    case ROLES.DISTRICT_ADMIN: return <DistrictAdminDashboard />
    case ROLES.STAFF:
    case ROLES.DOCTOR:
    case ROLES.NURSE:
    case ROLES.PHC_ADMIN:
    case ROLES.CHC_ADMIN: return <StaffDashboard />
    case ROLES.CITIZEN: return <CitizenDashboard />
    default: return <CitizenDashboard />
  }
}

export default function App() {
  const { theme } = useUIStore()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Protected App Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardRouter />} />

          {/* Patients - staff+ */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN]} />}>
            <Route path="/patients" element={<PatientList />} />
            <Route path="/patients/add" element={<AddPatient />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
          </Route>

          {/* Inventory - staff+ */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN]} />}>
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/inventory/add" element={<AddInventory />} />
            <Route path="/inventory/:id" element={<InventoryDetail />} />
          </Route>

          {/* Bed Management - staff+ */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN]} />}>
            <Route path="/beds" element={<BedManagement />} />
          </Route>

          {/* Appointments - all auth */}
          <Route path="/appointments" element={<AppointmentList />} />
          <Route path="/appointments/book" element={<BookAppointment />} />
          <Route path="/appointments/:id" element={<AppointmentDetail />} />

          {/* Attendance - staff+ */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN]} />}>
            <Route path="/attendance" element={<DoctorAttendance />} />
          </Route>

          {/* Reports - staff+ */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE, ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN]} />}>
            <Route path="/reports" element={<ReportList />} />
            <Route path="/reports/create" element={<CreateReport />} />
            <Route path="/reports/:id" element={<ReportDetail />} />
          </Route>

          {/* Analytics - district_admin+ */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN]} />}>
            <Route path="/analytics/district" element={<DistrictAnalytics />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
            <Route path="/analytics/national" element={<NationalAnalytics />} />
          </Route>

          {/* AI - district_admin+ */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN]} />}>
            <Route path="/ai" element={<AIDashboard />} />
          </Route>

          {/* Admin - district_admin+ */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN]} />}>
            <Route path="/admin/centers" element={<HealthCenterList />} />
            <Route path="/admin/centers/add" element={<AddHealthCenter />} />
            <Route path="/admin/centers/:id" element={<HealthCenterDetail />} />
            <Route path="/admin/role-requests" element={<RoleRequestsManager />} />
          </Route>

          {/* Super Admin only */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/settings" element={<SystemSettings />} />
          </Route>

          {/* Profile - all auth */}
          <Route path="/profile" element={<UserProfile />} />
        </Route>
      </Route>

      {/* Redirects & Error Pages */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
