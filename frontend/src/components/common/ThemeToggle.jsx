import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore()

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700',
        'text-gray-500 dark:text-gray-400 transition-colors'
      )}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  )
}
