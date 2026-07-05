import React, { forwardRef } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/utils/cn'

const DatePicker = forwardRef(function DatePicker(
  { label, error, helperText, className, required, id, min, max, ...props },
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
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={ref}
          type="date"
          id={inputId}
          min={min}
          max={max}
          className={cn('input-field pl-9', error && 'input-error')}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger-500" role="alert">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  )
})

export default DatePicker
