import React from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Calendar, Package, User } from 'lucide-react'
import { formatRelativeTime } from '@/utils/formatters'
import Card from '@/components/ui/Card'
import { cn } from '@/utils/cn'
import { Link } from 'react-router-dom'

const typeConfig = {
  patient: { icon: Users, color: 'bg-primary-100 text-primary-600', path: '/patients' },
  appointment: { icon: Calendar, color: 'bg-secondary-100 text-secondary-600', path: '/appointments' },
  inventory: { icon: Package, color: 'bg-warning-100 text-warning-600', path: '/inventory' },
  user: { icon: User, color: 'bg-purple-100 text-purple-600', path: '/admin/users' },
}

export default function RecentActivity({ activities = [], loading }) {
  const { t } = useTranslation()

  const mockActivities = activities.length === 0 ? [
    { type: 'patient', title: 'New patient registered', detail: 'John Doe', time: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { type: 'appointment', title: 'Appointment scheduled', detail: 'Dr. Smith - 2:30 PM', time: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { type: 'inventory', title: 'Stock updated', detail: 'Paracetamol +50 units', time: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    { type: 'patient', title: 'Patient checkup completed', detail: 'Jane Smith', time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { type: 'appointment', title: 'Appointment completed', detail: 'Dr. Patel - 10:00 AM', time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  ] : activities

  return (
    <Card title={t('dashboard.recentActivity')}>
      {loading ? (
        <div className="space-y-4 p-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {mockActivities.map((activity, i) => {
            const config = typeConfig[activity.type] || typeConfig.user
            const Icon = config.icon
            return (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', config.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{activity.detail}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                  {formatRelativeTime(activity.time)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
