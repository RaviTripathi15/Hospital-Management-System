import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Package, Calendar, FileText, BarChart2,
  Brain, Building2, UserCog, Settings, LogOut, Heart, X,
  ChevronLeft, ChevronRight, Activity, TrendingUp, Clock3, ShieldCheck
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'
import { getInitials } from '@/utils/formatters'

const NAV_GROUPS = [
  {
    label: 'navigation.overview',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'navigation.dashboard', roles: ['all'] },
    ],
  },
  {
    label: 'navigation.clinical',
    items: [
      { path: '/patients', icon: Users, label: 'navigation.patients', roles: ['staff', 'doctor', 'nurse', 'district_admin', 'super_admin'] },
      { path: '/appointments', icon: Calendar, label: 'navigation.appointments', roles: ['all'] },
      { path: '/ai-assistant', icon: Brain, label: 'navigation.aiAssistant', roles: ['all'] },
      { path: '/inventory', icon: Package, label: 'navigation.inventory', roles: ['staff', 'doctor', 'nurse', 'district_admin', 'super_admin'] },
      { path: '/beds', icon: Activity, label: 'navigation.beds', roles: ['staff', 'doctor', 'nurse', 'district_admin', 'super_admin'] },
      { path: '/attendance', icon: Clock3, label: 'navigation.attendance', roles: ['staff', 'doctor', 'nurse', 'district_admin', 'super_admin'] },
    ],
  },
  {
    label: 'navigation.reports',
    items: [
      { path: '/reports', icon: FileText, label: 'navigation.reports', roles: ['staff', 'doctor', 'nurse', 'district_admin', 'super_admin'] },
      { path: '/analytics/district', icon: BarChart2, label: 'navigation.districtAnalytics', roles: ['district_admin', 'super_admin'] },
      { path: '/analytics/national', icon: TrendingUp, label: 'navigation.nationalAnalytics', roles: ['super_admin'] },
    ],
  },
  {
    label: 'navigation.aiInsights',
    items: [
      { path: '/ai', icon: Brain, label: 'navigation.aiInsights', roles: ['district_admin', 'super_admin'] },
    ],
  },
  {
    label: 'navigation.administration',
    items: [
      { path: '/admin/centers', icon: Building2, label: 'navigation.healthCenters', roles: ['district_admin', 'super_admin'] },
      { path: '/admin/role-requests', icon: ShieldCheck, label: 'navigation.roleRequests', roles: ['district_admin', 'super_admin'] },
      { path: '/admin/users', icon: UserCog, label: 'navigation.userManagement', roles: ['super_admin'] },
      { path: '/admin/settings', icon: Settings, label: 'navigation.systemSettings', roles: ['super_admin'] },
    ],
  },
]

function canShowItem(item, role) {
  if (item.roles.includes('all')) return true
  return item.roles.includes(role)
}

export default function Sidebar({ onClose }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 76 : 260 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-150/60 dark:border-gray-800/60 overflow-hidden relative z-30"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-150/60 dark:border-gray-800/60 h-16 flex-shrink-0">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2.5 min-w-0"
            >
              <div className="w-8.5 h-8.5 bg-gradient-to-tr from-primary-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-primary-550/20">
                <Heart className="w-4.5 h-4.5 text-white fill-white/20" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight truncate">
                HealthCare
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="logo-collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="w-9.5 h-9.5 bg-gradient-to-tr from-primary-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-md shadow-primary-550/20"
            >
              <Heart className="w-5 h-5 text-white fill-white/10" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile close button */}
        {onClose && !sidebarCollapsed && (
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-850 lg:hidden text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleSidebarCollapse}
          className="hidden lg:flex p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors border border-transparent hover:border-gray-200/40 dark:hover:border-gray-800/40"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronLeft className="w-4.5 h-4.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 scrollbar-hide space-y-5">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => canShowItem(item, user?.role))
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label} className="space-y-1">
              {!sidebarCollapsed && (
                <p className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">
                  {t(group.label)}
                </p>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'sidebar-link group py-3 rounded-xl transition-all duration-200',
                      isActive ? 'active' : '',
                      sidebarCollapsed && 'justify-center px-0 py-3'
                    )
                  }
                  title={sidebarCollapsed ? t(item.label) : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0 group-hover:scale-105 transition-transform" />
                  {!sidebarCollapsed && (
                    <span className="truncate text-sm transition-transform duration-200">{t(item.label)}</span>
                  )}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* User section & Logout */}
      <div className="border-t border-gray-150/60 dark:border-gray-800/60 p-3 flex-shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-gray-50/60 dark:bg-gray-850/30 border border-gray-100/50 dark:border-gray-800/30">
            <div className="w-8.5 h-8.5 bg-primary-100 dark:bg-primary-950/40 rounded-xl flex items-center justify-center text-primary-700 dark:text-primary-400 text-xs font-bold flex-shrink-0 border border-primary-200/30 dark:border-primary-900/30">
              {getInitials(user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-550 truncate capitalize mt-0.5">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 active:scale-95',
            sidebarCollapsed && 'justify-center px-0'
          )}
          title={sidebarCollapsed ? t('auth.logout') : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span>{t('auth.logout')}</span>}
        </button>
      </div>
    </motion.aside>
  )
}
