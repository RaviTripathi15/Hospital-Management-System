import React from 'react'
import { cn } from '@/utils/cn'

export default function Card({
  children,
  header,
  footer,
  title,
  subtitle,
  action,
  padding = 'normal',
  className,
  hoverable = false,
  ...props
}) {
  const paddingMap = {
    none: '',
    sm: 'p-4',
    normal: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={cn(
        'card',
        hoverable && 'hover:shadow-elevated transition-shadow cursor-pointer',
        className
      )}
      {...props}
    >
      {(header || title) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          {header || (
            <div>
              {title && <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          )}
          {action && <div className="flex-shrink-0 ml-4">{action}</div>}
        </div>
      )}
      <div className={cn(paddingMap[padding])}>{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">{footer}</div>
      )}
    </div>
  )
}
