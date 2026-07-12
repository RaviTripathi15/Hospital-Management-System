import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, Bell, Search, User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

  const userMenuRef = useRef(null)
  const notificationRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setShowUserMenu(false)
    await logout()
  }

  return (
    <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-150/60 dark:border-gray-800/60 flex items-center gap-4 px-4 lg:px-6 flex-shrink-0 relative z-30">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md hidden sm:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t('common.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-850/80 border border-gray-200/50 dark:border-gray-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-gray-900 dark:text-gray-100 placeholder-gray-450 dark:placeholder-gray-500 transition-all shadow-inner-soft"
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5 ml-auto">
        <ThemeToggle />
        <LanguageSelector />

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }}
            className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            aria-label={t('notifications.title')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none ring-2 ring-white dark:ring-gray-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2 z-40"
              >
                <NotificationDropdown onClose={() => setShowNotifications(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-850 transition-all border border-transparent hover:border-gray-200/50 dark:hover:border-gray-800/50"
            aria-label="User menu"
          >
            <div className="w-8.5 h-8.5 bg-gradient-to-tr from-primary-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md shadow-primary-500/20">
              {getInitials(user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email)}
            </div>
            <div className="hidden md:block text-left max-w-[120px]">
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize leading-tight truncate mt-0.5">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block transition-transform duration-200" style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none' }} />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-elevated border border-gray-100 dark:border-gray-700/80 py-1.5 z-40 overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {user?.firstName ? `${user.firstName} ${user.lastName}` : 'User Account'}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-550 truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  {t('profile.title')}
                </Link>
                <Link
                  to="/admin/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  {t('navigation.settings')}
                </Link>
                <hr className="my-1.5 border-gray-100 dark:border-gray-700" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 w-full text-left font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('auth.logout')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

