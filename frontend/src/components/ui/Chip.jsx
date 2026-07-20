import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function Chip({
  children,
  variant = 'default',
  size = 'md',
  onRemove,
  icon: Icon,
  className,
  ...props
}) {
  const variantStyles = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    primary: 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800/40',
    success: 'bg-success-50 dark:bg-success-950/40 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800/40',
    warning: 'bg-warning-50 dark:bg-warning-950/40 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-800/40',
    danger: 'bg-danger-50 dark:bg-danger-950/40 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-800/40',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full border transition-colors select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-current"
          aria-label="Remove filter"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}
