import React from 'react'
import { Users, Calendar, Package, FileText, Building2, Activity, TrendingUp, AlertTriangle } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '@/utils/formatters'

export default function StatsOverview({ stats, loading }) {
  const { t } = useTranslation()

  const cards = [
    {
      key: 'totalPatients',
      title: t('dashboard.totalPatients'),
      value: formatNumber(stats?.totalPatients || 0),
      icon: Users,
      color: 'primary',
      trend: stats?.patientsTrend,
    },
    {
      key: 'todayAppointments',
      title: t('dashboard.todayAppointments'),
      value: formatNumber(stats?.todayAppointments || 0),
      icon: Calendar,
      color: 'secondary',
      trend: stats?.appointmentsTrend,
    },
    {
      key: 'lowStockItems',
      title: t('dashboard.lowStockItems'),
      value: formatNumber(stats?.lowStockItems || 0),
      icon: Package,
      color: stats?.lowStockItems > 0 ? 'warning' : 'success',
      trend: undefined,
    },
    {
      key: 'pendingReports',
      title: t('dashboard.pendingReports'),
      value: formatNumber(stats?.pendingReports || 0),
      icon: FileText,
      color: stats?.pendingReports > 0 ? 'warning' : 'success',
      trend: undefined,
    },
    {
      key: 'totalCenters',
      title: t('dashboard.totalCenters'),
      value: formatNumber(stats?.totalCenters || 0),
      icon: Building2,
      color: 'primary',
      trend: undefined,
    },
    {
      key: 'activeStaff',
      title: t('dashboard.activeStaff'),
      value: formatNumber(stats?.activeStaff || 0),
      icon: Activity,
      color: 'secondary',
      trend: undefined,
    },
  ]

  const visibleCards = stats?.totalCenters !== undefined ? cards : cards.slice(0, 4)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {visibleCards.map((card) => (
        <StatCard
          key={card.key}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          trend={card.trend}
          trendLabel="vs last month"
          loading={loading}
        />
      ))}
    </div>
  )
}
