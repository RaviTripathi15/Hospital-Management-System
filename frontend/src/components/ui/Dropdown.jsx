import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'

export default function Dropdown({ trigger, items, align = 'right', className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={cn('relative inline-block', className)} ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[160px] bg-white dark:bg-gray-800 rounded-xl shadow-elevated border border-gray-100 dark:border-gray-700 py-1',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, i) =>
            item.divider ? (
              <hr key={i} className="my-1 border-gray-100 dark:border-gray-700" />
            ) : (
              <button
                key={i}
                onClick={() => { item.onClick?.(); setOpen(false) }}
                disabled={item.disabled}
                className={cn(
                  'flex items-center gap-2 w-full px-4 py-2 text-sm text-left transition-colors',
                  item.danger
                    ? 'text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700',
                  item.disabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
