import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, Calendar, Pill, Sparkles, Megaphone, Heart, Trash2, CheckCircle2, Eye, EyeOff
} from 'lucide-react'
import { cn } from '@/utils/cn'

// Pre-populated high-fidelity mock notifications mapping user requirements
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Upcoming Appointment Reminder',
    message: 'Your consultation with Dr. Sarah Jenkins is scheduled for tomorrow at 10:00 AM at PHC Sector 4. Please carry your health card.',
    category: 'reminder',
    type: 'appointment',
    timestamp: '2 hours ago',
    isRead: false
  },
  {
    id: 'notif-2',
    title: 'Medicine Dosage Alert',
    message: 'Afternoon Prescription: Take Metformin 500mg with water. Remember to track your post-meal blood glucose levels.',
    category: 'reminder',
    type: 'medicine',
    timestamp: '15 minutes ago',
    isRead: false
  },
  {
    id: 'notif-3',
    title: 'AI Preventive Health Alert',
    message: 'Analysis of your 7-day vitals indicates a minor trend of elevated blood pressure. Reducing sodium intake is recommended.',
    category: 'ai',
    type: 'ai',
    timestamp: '5 hours ago',
    isRead: false
  },
  {
    id: 'notif-4',
    title: 'District Vaccination Drive',
    message: 'Annual immunization campaign: Free Influenza vaccine booster doses will be administered this Saturday at PHC Sector 4.',
    category: 'campaign',
    type: 'campaign',
    timestamp: '1 day ago',
    isRead: true
  },
  {
    id: 'notif-5',
    title: 'National Health Card Update',
    message: 'Government announcement: Unified Digital Health Cards are now linked with local primary facilities. Verify your profile status.',
    category: 'announcement',
    type: 'announcement',
    timestamp: '3 hours ago',
    isRead: true
  }
]

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS)
  const [activeTab, setActiveTab] = useState('all')

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Category filter mapping
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true
    return n.category === activeTab
  })

  // Mark specific notification as read
  const handleMarkRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n)
    )
  }

  // Delete specific notification with slide animation
  const handleDelete = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  // Clear all notifications
  const handleClearAll = () => {
    setNotifications([])
  }

  // Visual helper mapping category types to icons and color aesthetics
  const getCategoryConfig = (type) => {
    switch (type) {
      case 'appointment':
        return { icon: Calendar, color: 'text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100/30' }
      case 'medicine':
        return { icon: Pill, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-100/30' }
      case 'ai':
        return { icon: Sparkles, color: 'text-purple-650 bg-purple-50 dark:bg-purple-950/20 border-purple-100/30 animate-pulse' }
      case 'campaign':
        return { icon: Heart, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100/30' }
      case 'announcement':
        return { icon: Megaphone, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100/30' }
      default:
        return { icon: Bell, color: 'text-gray-600 bg-gray-50 dark:bg-gray-800' }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/60 dark:border-gray-700/60 shadow-soft space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-500 animate-swing" />
            Personal Notifications Center
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-black animate-pulse leading-none shrink-0">
                {unreadCount} New
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your reminders, alerts, and government announcements.
          </p>
        </div>

        {/* Global Action buttons */}
        {notifications.length > 0 && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-colors border border-gray-200/40 dark:border-gray-700/30 cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
            <button
              onClick={handleClearAll}
              className="px-3.5 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-100 dark:border-gray-700/50">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'reminder', label: 'Reminders' },
          { id: 'campaign', label: 'Campaigns' },
          { id: 'announcement', label: 'Announcements' },
          { id: 'ai', label: 'AI Insights' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border cursor-pointer active:scale-95",
              activeTab === tab.id
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200/40 dark:border-gray-700/30"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center border border-dashed border-gray-200 dark:border-gray-750 rounded-2xl bg-gray-50/20 dark:bg-gray-900/5"
            >
              <Bell className="w-10 h-10 text-gray-300 dark:text-gray-650 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-900 dark:text-white">All caught up!</p>
              <p className="text-[10px] text-gray-450 dark:text-gray-500 mt-0.5">No notifications in this filter.</p>
            </motion.div>
          ) : (
            filteredNotifications.map((notif) => {
              const conf = getCategoryConfig(notif.type)
              const Icon = conf.icon
              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className={cn(
                    "p-4 rounded-2xl border flex gap-4 items-start relative transition-all duration-300 group shadow-sm hover:shadow",
                    notif.isRead 
                      ? "bg-gray-50/20 dark:bg-gray-800/20 border-gray-200/30 dark:border-gray-800/20 opacity-80"
                      : "bg-white dark:bg-gray-900 border-gray-200/50 dark:border-gray-800/40"
                  )}
                >
                  {/* Unread indicator */}
                  {!notif.isRead && (
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full absolute -top-1 -left-1 border-2 border-white dark:border-gray-800 shadow" />
                  )}

                  {/* Icon */}
                  <div className={cn("p-2.5 rounded-xl border shrink-0", conf.color)}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className={cn("text-xs font-extrabold truncate", notif.isRead ? "text-gray-500 dark:text-gray-500" : "text-gray-900 dark:text-white")}>
                        {notif.title}
                      </h4>
                      <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-300 mt-1 font-medium select-none">
                      {notif.message}
                    </p>
                  </div>

                  {/* Card actions (Mark read & Delete) */}
                  <div className="flex gap-1 shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className={cn(
                        "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded-lg text-gray-400 hover:text-primary-600 transition-all active:scale-90 cursor-pointer",
                        notif.isRead && "text-primary-500"
                      )}
                      title={notif.isRead ? 'Mark as Unread' : 'Mark as Read'}
                    >
                      {notif.isRead ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-gray-400 hover:text-red-650 transition-all active:scale-90 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
