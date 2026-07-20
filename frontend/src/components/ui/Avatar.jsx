import React from 'react'
import { getInitials } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export default function Avatar({
  src,
  alt = 'User avatar',
  name,
  size = 'md',
  status, // 'online' | 'offline' | 'busy'
  className,
  ...props
}) {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const statusMap = {
    online: 'bg-emerald-500 ring-white dark:ring-slate-900',
    offline: 'bg-slate-400 ring-white dark:ring-slate-900',
    busy: 'bg-rose-500 ring-white dark:ring-slate-900',
  }

  return (
    <div className="relative inline-block" {...props}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            'rounded-xl object-cover border border-slate-200 dark:border-slate-700',
            sizeMap[size],
            className
          )}
        />
      ) : (
        <div
          className={cn(
            'bg-gradient-to-tr from-primary-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm select-none',
            sizeMap[size],
            className
          )}
        >
          {getInitials(name || alt)}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2',
            statusMap[status]
          )}
        />
      )}
    </div>
  )
}
