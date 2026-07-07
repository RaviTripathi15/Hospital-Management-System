import React, { useState } from 'react'
import { Users, TrendingUp, Calendar, Search, Filter } from 'lucide-react'
import Card from '@/components/ui/Card'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

export default function FootfallAnalytics({ data = [] }) {
  const { t } = useTranslation()
  const [timeRange, setTimeRange] = useState('week')

  // Mock data
  const mockData = {
    week: [
      { day: 'Mon', count: 120, predicted: 115 },
      { day: 'Tue', count: 145, predicted: 140 },
      { day: 'Wed', count: 132, predicted: 138 },
      { day: 'Thu', count: 158, predicted: 150 },
      { day: 'Fri', count: 175, predicted: 165 },
      { day: 'Sat', count: 190, predicted: 180 },
      { day: 'Sun', count: 85, predicted: 90 },
    ],
    month: [
      { day: 'Week 1', count: 850, predicted: 820 },
      { day: 'Week 2', count: 920, predicted: 890 },
      { day: 'Week 3', count: 880, predicted: 910 },
      { day: 'Week 4', count: 950, predicted: 930 },
    ],
  }

  const currentData = mockData[timeRange] || mockData.week
  const totalActual = currentData.reduce((sum, item) => sum + item.count, 0)
  const totalPredicted = currentData.reduce((sum, item) => sum + item.predicted, 0)
  const averageDaily = Math.round(totalActual / currentData.length)
  const trend = ((totalPredicted - totalActual) / totalActual * 100).toFixed(1)

  const maxValue = Math.max(...currentData.map(d => Math.max(d.count, d.predicted)))

  return (
    <Card title={t('dashboard.patientTrends')} className="animate-fade-in">
      {/* Time Range Selector */}
      <div className="flex gap-2 mb-4">
        {['week', 'month'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all',
              timeRange === range
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            {range === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Patients</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalActual}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Daily</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageDaily}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trend</p>
          <div className="flex items-center justify-center gap-1">
            {parseFloat(trend) > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />
            )}
            <p className={cn('text-2xl font-bold', parseFloat(trend) > 0 ? 'text-green-600' : 'text-red-600')}>
              {trend > 0 ? '+' : ''}{trend}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-3">
        {currentData.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">{item.day}</span>
              <div className="flex gap-4">
                <span className="text-gray-900 dark:text-white font-medium">{item.count}</span>
                <span className="text-primary-600 dark:text-primary-400 font-medium">{item.predicted}</span>
              </div>
            </div>
            <div className="flex gap-2 h-8">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                <div
                  className="h-full bg-primary-500 rounded-lg transition-all duration-500"
                  style={{ width: `${(item.count / maxValue) * 100}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                  Actual
                </span>
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                <div
                  className="h-full bg-primary-300 dark:bg-primary-600 rounded-lg transition-all duration-500"
                  style={{ width: `${(item.predicted / maxValue) * 100}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 font-medium">
                  Predicted
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary-500 rounded" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary-300 dark:bg-primary-600 rounded" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Predicted</span>
        </div>
      </div>
    </Card>
  )
}
