import { useAuthStore } from '@/store/authStore'
import { ROLES } from '@/utils/constants'

export function usePermissions() {
  const { user } = useAuthStore()
  const role = user?.role

  const hasRole = (roles) => {
    if (!role) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(role)
  }

  const isSuperAdmin = role === ROLES.SUPER_ADMIN
  const isDistrictAdmin = role === ROLES.DISTRICT_ADMIN
  const isStaff = [ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE].includes(role)
  const isDoctor = role === ROLES.DOCTOR
  const isNurse = role === ROLES.NURSE
  const isCitizen = role === ROLES.CITIZEN

  const canViewNational = isSuperAdmin
  const canViewDistrict = isSuperAdmin || isDistrictAdmin
  const canManageCenter = isSuperAdmin || isDistrictAdmin
  const canApproveReports = isSuperAdmin || isDistrictAdmin
  const canManageUsers = isSuperAdmin
  const canViewReports = !isCitizen
  const canCreateReports = isStaff || isDistrictAdmin || isSuperAdmin
  const canManagePatients = isStaff || isDistrictAdmin || isSuperAdmin
  const canManageInventory = isStaff || isDistrictAdmin || isSuperAdmin
  const canViewAI = isDistrictAdmin || isSuperAdmin
  const canViewAnalytics = isDistrictAdmin || isSuperAdmin
  const canBookAppointment = isCitizen
  const canManageAppointments = isStaff || isDistrictAdmin || isSuperAdmin
  const canSystemSettings = isSuperAdmin

  return {
    role,
    user,
    hasRole,
    isSuperAdmin,
    isDistrictAdmin,
    isStaff,
    isDoctor,
    isNurse,
    isCitizen,
    canViewNational,
    canViewDistrict,
    canManageCenter,
    canApproveReports,
    canManageUsers,
    canViewReports,
    canCreateReports,
    canManagePatients,
    canManageInventory,
    canViewAI,
    canViewAnalytics,
    canBookAppointment,
    canManageAppointments,
    canSystemSettings,
  }
}
