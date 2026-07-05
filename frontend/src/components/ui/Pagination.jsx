import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ITEMS_PER_PAGE_OPTIONS } from '@/utils/constants'
import { useTranslation } from 'react-i18next'

export default function Pagination({
  page,
  totalPages,
  total,
  from,
  to,
  limit,
  onPageChange,
  onLimitChange,
  className,
}) {
  const { t } = useTranslation()

  if (totalPages <= 1 && total <= 10) return null

  const getPageNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []
    let l

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i)
    }

    if (page - delta > 2) rangeWithDots.push('...')
    rangeWithDots.push(...range)
    if (page + delta < totalPages - 1) rangeWithDots.push('...')

    return [1, ...rangeWithDots, ...(totalPages > 1 ? [totalPages] : [])]
  }

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 pt-3', className)}>
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>
          {t('common.showing', { from, to, total })}
        </span>
        {onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {ITEMS_PER_PAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((num, i) =>
          num === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400">…</span>
          ) : (
            <button
              key={num}
              onClick={() => onPageChange(num)}
              className={cn(
                'w-8 h-8 text-sm rounded-lg font-medium transition-colors',
                page === num
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              )}
            >
              {num}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
