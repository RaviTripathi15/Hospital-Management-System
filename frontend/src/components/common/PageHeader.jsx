import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  action,
  children,
  className,
}) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
              {crumb.href ? (
                <Link to={crumb.href} className="hover:text-primary-600 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 dark:text-white font-medium' : ''}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {(action || children) && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {action || children}
          </div>
        )}
      </div>
    </div>
  )
}
