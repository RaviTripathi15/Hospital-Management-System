import React, { useEffect, useState, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import authService from '@/services/authService'

// Layouts
const MainLayout = React.lazy(() => import('@/components/layout/MainLayout'))
const AuthLayout = React.lazy(() => import('@/components/layout/AuthLayout'))

// Auth Pages
const Login = React.lazy(() => import('@/pages/auth/Login'))
const Register = React.lazy(() => import('@/pages/auth/Register'))
const ForgotPassword = React.lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = React.lazy(() => import('@/pages/auth/ResetPassword'))

// Dashboard Pages
const CitizenDashboard = React.lazy(() => import('@/pages/dashboard/CitizenDashboard'))
const StaffDashboard = React.lazy(() => import('@/pages/dashboard/StaffDashboard'))
const DistrictAdminDashboard = React.lazy(() => import('@/pages/dashboard/DistrictAdminDashboard'))
const SuperAdminDashboard = React.lazy(() => import('@/pages/dashboard/SuperAdminDashboard'))

// Patient Pages
const PatientList = React.lazy(() => import('@/pages/patients/PatientList'))
const PatientDetail = React.lazy(() => import('@/pages/patients/PatientDetail'))
const AddPatient = React.lazy(() => import('@/pages/patients/AddPatient'))

// Inventory Pages
const InventoryList = React.lazy(() => import('@/pages/inventory/InventoryList'))
const InventoryDetail = React.lazy(() => import('@/pages/inventory/InventoryDetail'))
const AddInventory = React.lazy(() => import('@/pages/inventory/AddInventory'))

// Appointment Pages
const AppointmentList = React.lazy(() => import('@/pages/appointments/AppointmentList'))
const AppointmentDetail = React.lazy(() => import('@/pages/appointments/AppointmentDetail'))
const BookAppointment = React.lazy(() => import('@/pages/appointments/BookAppointment'))

// Report Pages
const ReportList = React.lazy(() => import('@/pages/reports/ReportList'))
const ReportDetail = React.lazy(() => import('@/pages/reports/ReportDetail'))
const CreateReport = React.lazy(() => import('@/pages/reports/CreateReport'))

// Analytics Pages
const DistrictAnalytics = React.lazy(() => import('@/pages/analytics/DistrictAnalytics'))
const NationalAnalytics = React.lazy(() => import('@/pages/analytics/NationalAnalytics'))

// AI Page
const AIDashboard = React.lazy(() => import('@/pages/ai/AIDashboard'))
const AIHealthAssistantPage = React.lazy(() => import('@/pages/ai/AIHealthAssistantPage'))

// Admin Pages
const HealthCenterList = React.lazy(() => import('@/pages/admin/HealthCenterList'))
const HealthCenterDetail = React.lazy(() => import('@/pages/admin/HealthCenterDetail'))
const AddHealthCenter = React.lazy(() => import('@/pages/admin/AddHealthCenter'))
const UserManagement = React.lazy(() => import('@/pages/admin/UserManagement'))
const SystemSettings = React.lazy(() => import('@/pages/admin/SystemSettings'))
const BedManagement = React.lazy(() => import('@/pages/admin/BedManagement'))
const RoleRequestsManager = React.lazy(() => import('@/pages/admin/RoleRequestsManager'))

// Profile
const UserProfile = React.lazy(() => import('@/pages/profile/UserProfile'))

// Attendance
const DoctorAttendance = React.lazy(() => import('@/pages/attendance/DoctorAttendance'))

// Error Pages
const NotFound = React.lazy(() => import('@/pages/NotFound'))
const Unauthorized = React.lazy(() => import('@/pages/Unauthorized'))

// Guards
import ProtectedRoute from '@/components/common/ProtectedRoute'

// Constants
import { ROLES } from '@/utils/constants'

// Premium Loading Indicator for Transitions & Boot Checks
function FullPageLoader() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 max-w-sm w-full text-center">
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-4 border-primary-500/30 animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-primary-600 shadow-md shadow-primary-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>
        <div className="space-y-1 mt-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Restoring Health Workspace</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Securing connection to clinical systems...</p>
        </div>
      </div>
    </div>
  )
}

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
  const { isAuthenticated, token, updateUser, logout } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    const checkSession = async () => {
      if (isAuthenticated && token) {
        try {
          // Call me profile API endpoint to verify token validity
          const data = await authService.getMe()
          const userData = data.data || data
          updateUser(userData)
        } catch (err) {
          console.error("Automatic session verification failed. Retrying refresh...", err)
          // If token refresh fails, the axios interceptor forces logout.
          // Check if session became invalid.
          if (!useAuthStore.getState().isAuthenticated) {
            logout()
          }
        }
      }
      setIsCheckingAuth(false)
    }

    checkSession()
  }, [])

  if (isCheckingAuth) {
    return <FullPageLoader />
  }

  return (
    <Suspense fallback={<FullPageLoader />}>
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

            {/* AI Health Assistant - all auth */}
            <Route path="/ai-assistant" element={<AIHealthAssistantPage />} />

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
    </Suspense>
  )
}
