import React from 'react'
import { cn } from '@/utils/cn'

const colorMap = {
  green: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  red: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
  yellow: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  blue: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  teal: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400',
}

const statusColorMap = {
  active: 'green',
  inactive: 'gray',
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
  draft: 'gray',
  submitted: 'blue',
  scheduled: 'blue',
  confirmed: 'green',
  completed: 'green',
  cancelled: 'red',
  no_show: 'orange',
  low: 'yellow',
  normal: 'green',
  high: 'orange',
  critical: 'red',
  in_stock: 'green',
  low_stock: 'yellow',
  out_of_stock: 'red',
  expiring_soon: 'orange',
  expired: 'red',
}

export default function Badge({ children, color, status, size = 'md', className, dot = false }) {
  const resolvedColor = color || (status && statusColorMap[status?.toLowerCase()]) || 'gray'
  const colorClass = colorMap[resolvedColor] || colorMap.gray

  return (
    <span
      className={cn(
        'badge font-medium',
        colorClass,
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'lg' && 'text-sm px-3 py-1',
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5 inline-block', `bg-current`)} />
      )}
      {children}
    </span>
  )
}
