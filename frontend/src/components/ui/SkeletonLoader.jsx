import React from 'react'
import { cn } from '@/utils/cn'

export default function SkeletonLoader({
  type = 'card',
  count = 1,
  className,
}) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="card p-5 animate-pulse bg-white/70 dark:bg-gray-800/70">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-28 bg-gray-250 dark:bg-gray-700 rounded-lg" />
              <div className="w-10 h-10 bg-gray-250 dark:bg-gray-700 rounded-xl" />
            </div>
            <div className="h-8 w-20 bg-gray-250 dark:bg-gray-700 rounded-lg mb-2" />
            <div className="h-3.5 w-32 bg-gray-200 dark:bg-gray-750 rounded-lg" />
          </div>
        )
      case 'chart':
        return (
          <div className="card p-6 animate-pulse bg-white/70 dark:bg-gray-800/70 h-80 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-gray-250 dark:bg-gray-700 rounded-lg" />
                <div className="h-3 w-28 bg-gray-200 dark:bg-gray-750 rounded-lg" />
              </div>
              <div className="h-8 w-24 bg-gray-250 dark:bg-gray-700 rounded-lg" />
            </div>
            <div className="flex items-end gap-3 h-48 px-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-750 rounded-t-lg h-[40%]" />
              <div className="flex-1 bg-gray-250 dark:bg-gray-700 rounded-t-lg h-[70%]" />
              <div className="flex-1 bg-gray-200 dark:bg-gray-750 rounded-t-lg h-[55%]" />
              <div className="flex-1 bg-gray-250 dark:bg-gray-700 rounded-t-lg h-[90%]" />
              <div className="flex-1 bg-gray-200 dark:bg-gray-750 rounded-t-lg h-[30%]" />
              <div className="flex-1 bg-gray-250 dark:bg-gray-700 rounded-t-lg h-[65%]" />
              <div className="flex-1 bg-gray-200 dark:bg-gray-750 rounded-t-lg h-[80%]" />
            </div>
          </div>
        )
      case 'list':
        return (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-850/50 rounded-xl border border-gray-100/50 dark:border-gray-850/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-250 dark:bg-gray-700 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-250 dark:bg-gray-700 rounded-lg" />
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-750 rounded-lg" />
                  </div>
                </div>
                <div className="h-6 w-16 bg-gray-250 dark:bg-gray-700 rounded-full" />
              </div>
            ))}
          </div>
        )
      case 'vitals':
        return (
          <div className="card p-5 animate-pulse bg-white/70 dark:bg-gray-800/70 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-250 dark:bg-gray-700 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-750 rounded" />
              <div className="h-6 w-24 bg-gray-250 dark:bg-gray-700 rounded" />
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-750 rounded-full" />
            </div>
          </div>
        )
      default:
        return <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    }
  }

  return (
    <div className={cn('grid gap-4', className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <React.Fragment key={idx}>{renderSkeleton()}</React.Fragment>
      ))}
    </div>
  )
}
