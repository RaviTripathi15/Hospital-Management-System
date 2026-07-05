import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, Bell, Search, User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useAuth } from '@/hooks/useAuth'
import LanguageSelector from '@/components/common/LanguageSelector'
import ThemeToggle from '@/components/common/ThemeToggle'
import NotificationDropdown from '@/components/notifications/NotificationDropdown'
import { getInitials } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export default function Navbar({ onMenuClick }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { unreadCount } = useNotificationStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleLogout = async () => {
    setShowUserMenu(false)
    await logout()
  }

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 px-4 lg:px-6 flex-shrink-0 relative z-20">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md hidden sm:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />
        <LanguageSelector />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            aria-label={t('notifications.title')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center font-medium leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="User menu"
          >
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center text-primary-700 dark:text-primary-400 text-sm font-semibold">
              {getInitials(user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                {user?.firstName || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize leading-tight">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-elevated border border-gray-100 dark:border-gray-700 py-1 z-20">
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <User className="w-4 h-4" />
                  {t('profile.title')}
                </Link>
                <Link
                  to="/admin/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Settings className="w-4 h-4" />
                  {t('navigation.settings')}
                </Link>
                <hr className="my-1 border-gray-100 dark:border-gray-700" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                >
                  <LogOut className="w-4 h-4" />
                  {t('auth.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
