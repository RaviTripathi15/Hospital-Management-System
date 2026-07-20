import React from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/utils/cn'

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
}

const styles = {
  info: 'bg-primary-50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-200 border-primary-200 dark:border-primary-900/50 icon-primary-600 dark:icon-primary-400',
  success: 'bg-success-50 dark:bg-success-950/40 text-success-900 dark:text-success-200 border-success-200 dark:border-success-900/50 icon-success-600 dark:icon-success-400',
  warning: 'bg-warning-50 dark:bg-warning-950/40 text-warning-900 dark:text-warning-200 border-warning-200 dark:border-warning-900/50 icon-warning-600 dark:icon-warning-400',
  danger: 'bg-danger-50 dark:bg-danger-950/40 text-danger-900 dark:text-danger-200 border-danger-200 dark:border-danger-900/50 icon-danger-600 dark:icon-danger-400',
}

export default function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className,
  ...props
}) {
  const Icon = icons[variant]

  return (
    <div
      role="alert"
      className={cn(
        'p-4 rounded-xl border flex items-start gap-3 transition-all duration-200 shadow-sm',
        styles[variant],
        className
      )}
      {...props}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-xs sm:text-sm">
        {title && <h4 className="font-bold mb-0.5 leading-snug">{title}</h4>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
