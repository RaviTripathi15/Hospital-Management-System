import React from 'react'
import { cn } from '@/utils/cn'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'primary',
  loading = false,
  className,
  subtitle,
}) {
  const colorMap = {
    primary: {
      bg: 'bg-primary-50 dark:bg-primary-900/20',
      icon: 'text-primary-600 dark:text-primary-400',
      iconBg: 'bg-primary-100 dark:bg-primary-900/40',
    },
    success: {
      bg: 'bg-success-50 dark:bg-success-900/20',
      icon: 'text-success-600 dark:text-success-400',
      iconBg: 'bg-success-100 dark:bg-success-900/40',
    },
    warning: {
      bg: 'bg-warning-50 dark:bg-warning-900/20',
      icon: 'text-warning-600 dark:text-warning-400',
      iconBg: 'bg-warning-100 dark:bg-warning-900/40',
    },
    danger: {
      bg: 'bg-danger-50 dark:bg-danger-900/20',
      icon: 'text-danger-600 dark:text-danger-400',
      iconBg: 'bg-danger-100 dark:bg-danger-900/40',
    },
    secondary: {
      bg: 'bg-secondary-50 dark:bg-secondary-900/20',
      icon: 'text-secondary-600 dark:text-secondary-400',
      iconBg: 'bg-secondary-100 dark:bg-secondary-900/40',
    },
  }

  const colors = colorMap[color] || colorMap.primary

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="w-3.5 h-3.5" />
    if (trend < 0) return <TrendingDown className="w-3.5 h-3.5" />
    return <Minus className="w-3.5 h-3.5" />
  }

  const getTrendColor = () => {
    if (trend > 0) return 'text-success-600 dark:text-success-400'
    if (trend < 0) return 'text-danger-500 dark:text-danger-400'
    return 'text-gray-400'
  }

  if (loading) {
    return (
      <div className={cn('card p-5 animate-pulse', className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
        <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    )
  }

  return (
    <div className={cn('card p-5 hover:shadow-elevated transition-shadow', className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colors.iconBg)}>
            <Icon className={cn('w-5 h-5', colors.icon)} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      )}
      {trend !== undefined && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', getTrendColor())}>
          {getTrendIcon()}
          <span>{Math.abs(trend)}%</span>
          {trendLabel && <span className="text-gray-400 font-normal">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}
