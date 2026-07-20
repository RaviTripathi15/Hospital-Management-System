import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, ArrowLeftRight, UserCheck, Home, HelpCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'
import RoleSwitchModal from '@/components/common/RoleSwitchModal'

export default function Unauthorized() {
  const { t } = useTranslation()
  const { user, login } = useAuthStore()
  const location = useLocation()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Extract allowed roles passed from ProtectedRoute or URL search query parameters
  const getRolesFromQuery = () => {
    try {
      const searchParams = new URLSearchParams(location.search)
      const allowedRolesQuery = searchParams.get('allowedRoles')
      return allowedRolesQuery ? JSON.parse(decodeURIComponent(allowedRolesQuery)) : []
    } catch (e) {
      console.error('Error parsing allowedRoles query param:', e)
      return []
    }
  }
  const requiredRoles = location.state?.allowedRoles || getRolesFromQuery()

  // Helper to format role name for display
  const formatRole = (role) => {
    if (!role) return 'Unknown'
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  // Handle immediate auto-approval changes locally
  const handleRoleSuccess = (updatedUser, accessToken, refreshToken) => {
    if (updatedUser && accessToken && refreshToken) {
      login(updatedUser, accessToken, refreshToken)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full text-center space-y-8">
        
        {/* Animated Illustration */}
        <div className="relative flex justify-center">
          {/* Pulsing backdrop ring */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute w-32 h-32 bg-red-500/10 rounded-full blur-xl"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="relative p-6 bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 rounded-3xl border border-red-100/50 dark:border-red-900/30 shadow-lg"
          >
            <ShieldAlert className="w-16 h-16" />
          </motion.div>
        </div>

        {/* Text details */}
        <div className="space-y-3">
          <motion.h1
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight"
          >
            403 - Access Denied
          </motion.h1>
          <motion.p
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed"
          >
            You do not have permission to view this page. This resource is reserved for authorized healthcare personnel or specific management administrators.
          </motion.p>
        </div>

        {/* Roles details block */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-3xl p-6 grid grid-cols-2 gap-4 divide-x divide-gray-200 dark:divide-gray-700 text-left max-w-md mx-auto shadow-sm"
        >
          <div className="pr-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Current Role</span>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{formatRole(user?.role)}</span>
            </div>
          </div>
          <div className="pl-6 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Required Role</span>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                {requiredRoles.length > 0
                  ? requiredRoles.map(r => formatRole(r)).join(' or ')
                  : 'Healthcare Staff / Admin'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Buttons Action Group */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto"
        >
          {/* Switch Role Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary w-full sm:flex-1 py-3.5 flex items-center justify-center gap-2.5"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Switch Role
          </button>

          {/* Request Access Button (does same thing, triggers modal) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn bg-primary-50 hover:bg-primary-100 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400 hover:dark:bg-primary-950/40 w-full sm:flex-1 py-3.5 flex items-center justify-center gap-2.5"
          >
            <UserCheck className="w-4 h-4" />
            Request Access
          </button>
        </motion.div>

        {/* Back to Dashboard Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </motion.div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <RoleSwitchModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleRoleSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
