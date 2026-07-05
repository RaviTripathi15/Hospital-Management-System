import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore()
  const { t } = useTranslation()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/3 rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-elevated mb-4">
            <Heart className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('common.appName')}</h1>
          <p className="text-primary-200 text-sm mt-1">Health Centre Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-elevated p-8">
          <Outlet />
        </div>

        <p className="text-center text-primary-200 text-xs mt-6">
          © {new Date().getFullYear()} HealthCare Platform. All rights reserved.
        </p>
      </div>
    </div>
  )
}
