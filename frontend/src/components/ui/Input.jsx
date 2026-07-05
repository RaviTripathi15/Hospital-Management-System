import React, { forwardRef } from 'react'
import { cn } from '@/utils/cn'

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    prefixIcon: PrefixIcon,
    suffixIcon: SuffixIcon,
    onSuffixClick,
    className,
    inputClassName,
    required,
    id,
    ...props
  },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={cn('form-group', className)}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {PrefixIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <PrefixIcon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'input-field',
            PrefixIcon && 'pl-9',
            SuffixIcon && 'pr-9',
            error && 'input-error',
            inputClassName
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {SuffixIcon && (
          <button
            type="button"
            onClick={onSuffixClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <SuffixIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-danger-500" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  )
})

export default Input
