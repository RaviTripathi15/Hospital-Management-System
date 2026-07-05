import React from 'react'
import { cn } from '@/utils/cn'
import { formatRelativeTime } from '@/utils/formatters'
import { Bell, Package, Calendar, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

const typeIcons = {
  stock_alert: Package,
  expiry_alert: AlertTriangle,
  appointment_reminder: Calendar,
  report_due: FileText,
  system_alert: Bell,
  new_patient: CheckCircle,
  report_approved: CheckCircle,
  report_rejected: XCircle,
}

const typeColors = {
  stock_alert: 'text-warning-600 bg-warning-100',
  expiry_alert: 'text-orange-600 bg-orange-100',
  appointment_reminder: 'text-primary-600 bg-primary-100',
  report_due: 'text-blue-600 bg-blue-100',
  system_alert: 'text-gray-600 bg-gray-100',
  new_patient: 'text-success-600 bg-success-100',
  report_approved: 'text-success-600 bg-success-100',
  report_rejected: 'text-danger-600 bg-danger-100',
}

export default function NotificationItem({ notification, onRead, onDelete }) {
  const Icon = typeIcons[notification.type] || Bell
  const colorClass = typeColors[notification.type] || 'text-gray-600 bg-gray-100'

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-lg cursor-pointer transition-colors',
        !notification.isRead
          ? 'bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
      )}
      onClick={() => !notification.isRead && onRead?.(notification._id)}
    >
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm', colorClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !notification.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200')}>
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1.5" />
      )}
    </div>
  )
}
