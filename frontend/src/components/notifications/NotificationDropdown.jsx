import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CheckCheck, Trash2 } from 'lucide-react'
import notificationService from '@/services/notificationService'
import { useNotificationStore } from '@/store/notificationStore'
import NotificationItem from './NotificationItem'
import Spinner from '@/components/ui/Spinner'

export default function NotificationDropdown({ onClose }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { notifications, setNotifications } = useNotificationStore()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll({ limit: 10 }),
  })

  useEffect(() => {
    if (data?.data) setNotifications(data.data)
  }, [data, setNotifications])

  const markReadMutation = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-elevated border border-gray-100 dark:border-gray-700 z-20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {t('notifications.title')}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => markAllReadMutation.mutate()}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-primary-600"
              title={t('notifications.markAllRead')}
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : notifications.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-6">{t('notifications.noNotifications')}</p>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <NotificationItem
                key={n._id}
                notification={n}
                onRead={(id) => markReadMutation.mutate(id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
          <Link
            to="/notifications"
            onClick={onClose}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            {t('notifications.viewAll')}
          </Link>
        </div>
      </div>
    </>
  )
}
