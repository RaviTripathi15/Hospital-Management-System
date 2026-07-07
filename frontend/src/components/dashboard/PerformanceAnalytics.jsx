import React, { useState } from 'react'
import { TrendingUp, TrendingDown, Award, Target, BarChart3, PieChart } from 'lucide-react'
import Card from '@/components/ui/Card'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

export default function PerformanceAnalytics({ data = [] }) {
  const { t } = useTranslation()
  const [metric, setMetric] = useState('overall')

  // Mock data
  const mockData = {
    overall: [
      { center: 'City Hospital', score: 92, patients: 1250, satisfaction: 4.5 },
      { center: 'District Hospital', score: 88, patients: 980, satisfaction: 4.3 },
      { center: 'Community Health Center', score: 85, patients: 750, satisfaction: 4.2 },
      { center: 'Primary Health Center', score: 78, patients: 520, satisfaction: 4.0 },
      { center: 'Sub Center', score: 72, patients: 320, satisfaction: 3.8 },
    ],
    efficiency: [
      { center: 'City Hospital', score: 95, metric: 'Resource Utilization' },
      { center: 'District Hospital', score: 90, metric: 'Resource Utilization' },
      { center: 'Community Health Center', score: 82, metric: 'Resource Utilization' },
      { center: 'Primary Health Center', score: 75, metric: 'Resource Utilization' },
      { center: 'Sub Center', score: 68, metric: 'Resource Utilization' },
    ],
    quality: [
      { center: 'City Hospital', score: 94, metric: 'Patient Satisfaction' },
      { center: 'District Hospital', score: 89, metric: 'Patient Satisfaction' },
      { center: 'Community Health Center', score: 86, metric: 'Patient Satisfaction' },
      { center: 'Primary Health Center', score: 80, metric: 'Patient Satisfaction' },
      { center: 'Sub Center', score: 74, metric: 'Patient Satisfaction' },
    ],
  }

  const currentData = mockData[metric] || mockData.overall
  const averageScore = Math.round(currentData.reduce((sum, item) => sum + item.score, 0) / currentData.length)
  const topPerformer = currentData.reduce((max, item) => item.score > max.score ? item : max, currentData[0])

  const getScoreColor = (score) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 80) return 'bg-blue-500'
    if (score >= 70) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 70) return 'Average'
    return 'Needs Improvement'
  }

  return (
    <Card title={t('analytics.title')} className="animate-fade-in">
      {/* Metric Selector */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'overall', label: 'Overall', icon: BarChart3 },
          { key: 'efficiency', label: 'Efficiency', icon: Target },
          { key: 'quality', label: 'Quality', icon: Award },
        ].map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.key}
              onClick={() => setMetric(item.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                metric === item.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-primary-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Top Performer</span>
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">{topPerformer.center}</p>
          <p className="text-2xl font-bold text-primary-600">{topPerformer.score}%</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Average Score</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{averageScore}%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{getScoreLabel(averageScore)}</p>
        </div>
      </div>

      {/* Performance List */}
      <div className="space-y-3">
        {currentData.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{index + 1}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{item.center}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.patients && `${item.patients} patients • `}
                    {item.satisfaction && `Satisfaction: ${item.satisfaction}/5 • `}
                    {item.metric}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{item.score}%</span>
                <span className={cn('text-xs font-medium px-2 py-1 rounded-full text-white', getScoreColor(item.score))}>
                  {getScoreLabel(item.score)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={cn('h-3 rounded-full transition-all duration-500', getScoreColor(item.score))}
                style={{ width: `${item.score}%` }}
              />
            </div>

            {/* Trend Indicator */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                +5% from last month
              </span>
              <span>Target: 85%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Excellent (90%+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Good (80%+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Average (70%+)</span>
        </div>
      </div>
    </Card>
  )
}
