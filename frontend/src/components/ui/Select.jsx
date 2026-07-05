import React, { forwardRef } from 'react'
import { cn } from '@/utils/cn'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(function Select(
  { label, error, helperText, options = [], placeholder, className, required, id, ...props },
  ref
) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={cn('form-group', className)}>
      {label && (
        <label htmlFor={selectId} className="label">
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'input-field appearance-none pr-9',
            error && 'input-error'
          )}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {error && (
        <p className="mt-1 text-xs text-danger-500" role="alert">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  )
})

export default Select
