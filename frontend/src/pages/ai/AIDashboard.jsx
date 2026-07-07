import React from 'react'
import PredictionDashboard from '@/components/dashboard/PredictionDashboard'

export default function AIDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Health & Resource Insights</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Automated disease outbreak warnings, patient load predictions, and inventory optimization recommendations.
        </p>
      </div>
      <PredictionDashboard />
    </div>
  )
}
