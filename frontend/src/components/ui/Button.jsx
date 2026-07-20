import React from 'react'
import { cn } from '@/utils/cn'
import Spinner from './Spinner'

const variants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white focus-visible:ring-primary-500 border-transparent shadow-sm',
  secondary: 'bg-white dark:bg-[#131c2e] border-slate-200 dark:border-[#1e2d4a] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1e2d4a]/60 focus-visible:ring-slate-400',
  outline: 'bg-transparent border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 focus-visible:ring-primary-500',
  ghost: 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-[#1e2d4a]/60 text-slate-700 dark:text-slate-200 focus-visible:ring-slate-400',
  success: 'bg-success-600 hover:bg-success-700 text-white focus-visible:ring-success-500 border-transparent shadow-sm',
  danger: 'bg-danger-600 hover:bg-danger-700 text-white focus-visible:ring-danger-500 border-transparent shadow-sm',
  warning: 'bg-warning-500 hover:bg-warning-600 text-white focus-visible:ring-warning-500 border-transparent shadow-sm',
  info: 'bg-sky-600 hover:bg-sky-700 text-white focus-visible:ring-sky-500 border-transparent shadow-sm',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-lg',
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg',
  md: 'px-4 py-2 text-sm font-semibold rounded-xl',
  lg: 'px-5 py-2.5 text-base font-semibold rounded-xl',
  xl: 'px-6 py-3 text-base font-bold rounded-2xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className,
  type = 'button',
  fullWidth = false,
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 border font-semibold transition-all duration-150 select-none cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-95',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" className={variant === 'primary' || variant === 'danger' || variant === 'success' || variant === 'warning' || variant === 'info' ? 'text-white' : 'text-current'} />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
    </button>
  )
}
