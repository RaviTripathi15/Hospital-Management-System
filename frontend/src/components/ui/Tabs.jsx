import React from 'react'
import { cn } from '@/utils/cn'

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'pill', // 'pill' | 'line'
  className
}) {
  const handleKeyDown = (e, currentIndex) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const nextIndex = (currentIndex + 1) % tabs.length
      onChange(tabs[nextIndex].id)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length
      onChange(tabs[prevIndex].id)
    }
  }

  return (
    <div className={cn('overflow-x-auto scrollbar-hide py-1', className)}>
      <nav
        aria-label="Tabs"
        role="tablist"
        className={cn(
          'flex gap-1.5 items-center',
          variant === 'line' && 'border-b border-slate-200 dark:border-[#1e2d4a] pb-0'
        )}
      >
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              data-state={isActive ? 'active' : 'inactive'}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                variant === 'pill'
                  ? 'tab-pill'
                  : cn(
                      'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                      isActive
                        ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 font-bold'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300'
                    )
              )}
            >
              <span className="flex items-center gap-2 pointer-events-none">
                {tab.icon && <tab.icon className="w-4 h-4" />}
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none',
                      isActive
                        ? variant === 'pill'
                          ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
                          : 'bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
