import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Package, AlertTriangle, FileText, ChevronRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import { cn } from '@/utils/cn'

export default function AlertsPanel({ alerts = {} }) {
  const { t } = useTranslation()

  const allAlerts = [
    ...(alerts.lowStock || []).map(item => ({
      type: 'stock',
      icon: Package,
      color: 'text-warning-600 bg-warning-100',
      message: `${item.name} — ${item.quantity} ${item.unit} remaining`,
      link: `/inventory/${item._id}`,
    })),
    ...(alerts.expiring || []).map(item => ({
      type: 'expiry',
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-100',
      message: `${item.name} — expires in ${item.daysToExpiry} days`,
      link: `/inventory/${item._id}`,
    })),
    ...(alerts.pendingReports || []).map(report => ({
      type: 'report',
      icon: FileText,
      color: 'text-primary-600 bg-primary-100',
      message: `${report.title} — pending approval`,
      link: `/reports/${report._id}`,
    })),
  ]

  // Mock data if empty
  const displayAlerts = allAlerts.length === 0 ? [
    { type: 'stock', icon: Package, color: 'text-warning-600 bg-warning-100', message: 'Paracetamol — 5 tablets remaining', link: '/inventory' },
    { type: 'expiry', icon: AlertTriangle, color: 'text-orange-600 bg-orange-100', message: 'ORS Sachets — expires in 12 days', link: '/inventory' },
    { type: 'report', icon: FileText, color: 'text-primary-600 bg-primary-100', message: 'Monthly Report May 2024 — pending', link: '/reports' },
  ] : allAlerts

  if (displayAlerts.length === 0) {
    return (
      <Card title={t('dashboard.alerts')}>
        <p className="text-sm text-gray-500 py-4 text-center">{t('dashboard.noAlerts')}</p>
      </Card>
    )
  }

  return (
    <Card title={t('dashboard.alerts')}>
      <div className="space-y-2">
        {displayAlerts.slice(0, 8).map((alert, i) => {
          const Icon = alert.icon
          return (
            <Link
              key={i}
              to={alert.link}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', alert.color)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200 flex-1 min-w-0 truncate">{alert.message}</p>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
