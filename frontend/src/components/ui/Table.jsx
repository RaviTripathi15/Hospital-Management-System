import React from 'react'
import { cn } from '@/utils/cn'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import EmptyState from './EmptyState'
import Pagination from './Pagination'

function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export default function Table({
  columns,
  data,
  loading,
  emptyState,
  sortConfig,
  onSort,
  pagination,
  className,
  rowKey = '_id',
  onRowClick,
}) {
  const renderSortIcon = (col) => {
    if (!col.sortable) return null
    if (sortConfig?.field === col.key) {
      return sortConfig.direction === 'asc'
        ? <ChevronUp className="w-3.5 h-3.5 text-primary-600" />
        : <ChevronDown className="w-3.5 h-3.5 text-primary-600" />
    }
    return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
  }

  return (
    <div className={cn('', className)}>
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'table-header whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.width && `w-${col.width}`
                  )}
                  onClick={col.sortable ? () => onSort?.(col.key) : undefined}
                  scope="col"
                >
                  <div className={cn('flex items-center gap-1', col.align === 'right' && 'justify-end', col.align === 'center' && 'justify-center')}>
                    {col.header}
                    {renderSortIcon(col)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : data?.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  {emptyState || <EmptyState title="No data found" />}
                </td>
              </tr>
            ) : (
              data?.map((row) => (
                <tr
                  key={row[rowKey] || row.id}
                  className={cn(
                    'hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'table-cell',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center'
                      )}
                    >
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="px-4 pb-2">
          <Pagination {...pagination} />
        </div>
      )}
    </div>
  )
}
