import React, { useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useDebounce } from '@/hooks/useDebounce'
import { useEffect } from 'react'

export default function SearchBar({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  className,
  initialValue = '',
}) {
  const [value, setValue] = useState(initialValue)
  const debouncedValue = useDebounce(value, debounceMs)

  useEffect(() => {
    onSearch?.(debouncedValue)
  }, [debouncedValue])

  const handleClear = () => {
    setValue('')
    onSearch?.('')
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        aria-label={placeholder}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
