import React from 'react'
import { cn } from '@/utils/cn'
import Spinner from './Spinner'

const variants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 border-transparent',
  secondary: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-300',
  danger: 'bg-danger-600 hover:bg-danger-700 text-white focus:ring-danger-500 border-transparent',
  success: 'bg-success-600 hover:bg-success-700 text-white focus:ring-success-500 border-transparent',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent focus:ring-gray-300',
  outline: 'bg-transparent border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500',
  warning: 'bg-warning-500 hover:bg-warning-600 text-white focus:ring-warning-400 border-transparent',
}

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-xl',
  xl: 'px-6 py-3 text-base rounded-xl',
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
        'inline-flex items-center justify-center gap-2 font-medium border transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" className={variant === 'primary' || variant === 'danger' ? 'text-white' : 'text-current'} />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
    </button>
  )
}
