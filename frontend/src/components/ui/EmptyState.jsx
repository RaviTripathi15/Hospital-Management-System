import React from 'react'
import { cn } from '@/utils/cn'
import { Inbox } from 'lucide-react'
import Button from './Button'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data',
  description,
  action,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{description}</p>
      )}
      {(action || onAction) && (
        <div className="mt-4">
          {action || (
            <Button onClick={onAction} size="sm">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
