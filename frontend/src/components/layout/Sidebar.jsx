import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Users, Package, Calendar, FileText, BarChart2,
  Brain, Building2, UserCog, Settings, LogOut, Heart, X,
  ChevronLeft, ChevronRight, Activity, TrendingUp, Clock3
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
    <aside
      className={cn(
        'flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700 h-16">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm truncate">HealthCare</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
            <Heart className="w-4 h-4 text-white" />
          </div>
        )}
        {/* Mobile close button */}
        {onClose && !sidebarCollapsed && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={toggleSidebarCollapse}
          className="hidden lg:flex p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-hide">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => canShowItem(item, user?.role))
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label} className="mb-4">
              {!sidebarCollapsed && (
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-1">
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
                      'sidebar-link mb-0.5',
                      isActive && 'active',
                      sidebarCollapsed && 'justify-center px-0 py-2.5'
                    )
                  }
                  title={sidebarCollapsed ? t(item.label) : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{t(item.label)}</span>}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* User section & Logout */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center text-primary-700 dark:text-primary-400 text-sm font-semibold flex-shrink-0">
              {getInitials(user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors',
            sidebarCollapsed && 'justify-center px-0'
          )}
          title={sidebarCollapsed ? t('auth.logout') : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span>{t('auth.logout')}</span>}
        </button>
      </div>
    </aside>
  )
}
