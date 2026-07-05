import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { LANGUAGES } from '@/utils/constants'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const { setLanguage } = useUIStore()
  const [open, setOpen] = useState(false)

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]

  const handleChange = (code) => {
    i18n.changeLanguage(code)
    setLanguage(code)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLang.code.toUpperCase()}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-elevated border border-gray-100 dark:border-gray-700 py-1 z-20">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleChange(lang.code)}
                className={cn(
                  'flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700',
                  i18n.language === lang.code
                    ? 'text-primary-600 dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-gray-200'
                )}
              >
                <span>{lang.label}</span>
                <span className="text-xs text-gray-400">{lang.nativeLabel}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
