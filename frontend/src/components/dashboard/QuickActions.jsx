import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UserPlus, Calendar, Package, FileText, Building2, UserCog } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import Card from '@/components/ui/Card'
import { cn } from '@/utils/cn'

const allActions = [
  {
    label: 'dashboard.registerPatient',
    icon: UserPlus,
    link: '/patients/add',
    color: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100',
    permission: 'canManagePatients',
  },
  {
    label: 'dashboard.bookAppointment',
    icon: Calendar,
    link: '/appointments/book',
    color: 'bg-secondary-50 dark:bg-secondary-900/20 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100',
    permission: 'all',
  },
  {
    label: 'dashboard.addInventory',
    icon: Package,
    link: '/inventory/add',
    color: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400 hover:bg-warning-100',
    permission: 'canManageInventory',
  },
  {
    label: 'dashboard.createReport',
    icon: FileText,
    link: '/reports/create',
    color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100',
    permission: 'canCreateReports',
  },
  {
    label: 'admin.addCenter',
    icon: Building2,
    link: '/admin/centers/add',
    color: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 hover:bg-success-100',
    permission: 'canManageCenter',
  },
  {
    label: 'admin.addUser',
    icon: UserCog,
    link: '/admin/users',
    color: 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100',
    permission: 'canManageUsers',
  },
]

export default function QuickActions() {
  const { t } = useTranslation()
  const permissions = usePermissions()

  const visibleActions = allActions.filter(a =>
    a.permission === 'all' || permissions[a.permission]
  )

  return (
    <Card title={t('dashboard.quickActions')}>
      <div className="grid grid-cols-2 gap-2">
        {visibleActions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              to={action.link}
              className={cn(
                'flex items-center gap-2.5 p-3 rounded-xl font-medium text-sm transition-colors',
                action.color
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{t(action.label)}</span>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
