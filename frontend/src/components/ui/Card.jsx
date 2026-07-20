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
  glass = false,
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
        glass ? 'glass-card' : 'card',
        hoverable && 'hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
        className
      )}
      {...props}
    >
      {(header || title) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-[#1e2d4a]">
          {header || (
            <div>
              {title && <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          )}
          {action && <div className="flex-shrink-0 ml-4">{action}</div>}
        </div>
      )}
      <div className={cn(paddingMap[padding])}>{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-[#1e2d4a]">{footer}</div>
      )}
    </div>
  )
}
