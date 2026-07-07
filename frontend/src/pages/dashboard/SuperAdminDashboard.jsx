import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import StatsOverview from '@/components/dashboard/StatsOverview'
import AlertsPanel from '@/components/dashboard/AlertsPanel'
import MedicineStatus from '@/components/dashboard/MedicineStatus'
import FootfallAnalytics from '@/components/dashboard/FootfallAnalytics'
import BedAvailability from '@/components/dashboard/BedAvailability'
import DoctorAttendance from '@/components/dashboard/DoctorAttendance'
import ResourceRecommendation from '@/components/dashboard/ResourceRecommendation'
import PerformanceAnalytics from '@/components/dashboard/PerformanceAnalytics'
import PredictionDashboard from '@/components/dashboard/PredictionDashboard'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentActivity from '@/components/dashboard/RecentActivity'

export default function SuperAdminDashboard() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalPatients: 4520,
    todayAppointments: 128,
    lowStockItems: 23,
    pendingReports: 8,
    totalCenters: 45,
    activeStaff: 320,
    patientsTrend: 12.5,
    appointmentsTrend: 8.3,
  })

  const [alerts, setAlerts] = useState({
    lowStock: [
      { _id: '1', name: 'Paracetamol', quantity: 5, unit: 'tablets' },
      { _id: '2', name: 'Amoxicillin', quantity: 12, unit: 'capsules' },
    ],
    expiring: [
      { _id: '3', name: 'ORS Sachets', daysToExpiry: 12 },
      { _id: '4', name: 'Insulin', daysToExpiry: 18 },
    ],
    pendingReports: [
      { _id: '5', title: 'Monthly Report May 2024' },
      { _id: '6', title: 'Quarterly Report Q2 2024' },
    ],
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('dashboard.welcome', { name: 'Super Admin' })}
          </p>
        </div>
        <QuickActions />
      </div>

      {/* Stats Overview */}
      <StatsOverview stats={stats} loading={loading} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Medicine Status */}
        <div className="lg:col-span-1 xl:col-span-1">
          <MedicineStatus />
        </div>

        {/* Footfall Analytics */}
        <div className="lg:col-span-1 xl:col-span-1">
          <FootfallAnalytics />
        </div>

        {/* Alerts Panel */}
        <div className="lg:col-span-1 xl:col-span-1">
          <AlertsPanel alerts={alerts} />
        </div>

        {/* Bed Availability */}
        <div className="lg:col-span-1 xl:col-span-1">
          <BedAvailability />
        </div>

        {/* Doctor Attendance */}
        <div className="lg:col-span-1 xl:col-span-1">
          <DoctorAttendance />
        </div>

        {/* Resource Recommendations */}
        <div className="lg:col-span-1 xl:col-span-1">
          <ResourceRecommendation />
        </div>
      </div>

      {/* Performance Analytics - Full Width */}
      <div className="grid grid-cols-1 gap-6">
        <PerformanceAnalytics />
      </div>

      {/* AI Predictions Section */}
      <div className="grid grid-cols-1 gap-6">
        <PredictionDashboard />
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  )
}
