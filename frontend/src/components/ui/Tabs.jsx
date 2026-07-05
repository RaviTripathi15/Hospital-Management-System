import React from 'react'
import { cn } from '@/utils/cn'

export default function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div className={cn('border-b border-gray-200 dark:border-gray-700', className)}>
      <nav className="flex gap-1" aria-label="Tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
            )}
          >
            <span className="flex items-center gap-2">
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  activeTab === tab.id
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                )}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}
