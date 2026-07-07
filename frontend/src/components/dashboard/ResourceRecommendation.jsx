import React from 'react'
import { ArrowRight, Truck, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'
import Card from '@/components/ui/Card'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

export default function ResourceRecommendation({ recommendations = [] }) {
  const { t } = useTranslation()

  // Mock data
  const mockRecommendations = [
    {
      id: 1,
      type: 'transfer',
      priority: 'high',
      from: 'District Hospital',
      to: 'Community Health Center',
      item: 'Paracetamol Tablets',
      quantity: 200,
      reason: 'Low stock at destination',
      estimatedImpact: 'Reduce stockout risk by 40%',
    },
    {
      id: 2,
      type: 'procure',
      priority: 'critical',
      item: 'Insulin Vials',
      quantity: 50,
      center: 'Primary Health Center',
      reason: 'Expiring stock at nearby center',
      estimatedImpact: 'Ensure 30-day supply',
    },
    {
      id: 3,
      type: 'staff',
      priority: 'medium',
      from: 'City Hospital',
      to: 'Sub Center',
      role: 'Doctor',
      count: 1,
      reason: 'High patient load',
      estimatedImpact: 'Reduce wait time by 25%',
    },
    {
      id: 4,
      type: 'transfer',
      priority: 'low',
      from: 'Community Health Center',
      to: 'District Hospital',
      item: 'ORS Sachets',
      quantity: 100,
      reason: 'Surplus at source',
      estimatedImpact: 'Optimize inventory levels',
    },
  ]

  const displayRecommendations = recommendations.length > 0 ? recommendations : mockRecommendations

  const getTypeConfig = (type) => {
    switch (type) {
      case 'transfer':
        return { icon: Truck, color: 'bg-blue-100 text-blue-600', label: 'Transfer' }
      case 'procure':
        return { icon: AlertCircle, color: 'bg-orange-100 text-orange-600', label: 'Procure' }
      case 'staff':
        return { icon: TrendingUp, color: 'bg-purple-100 text-purple-600', label: 'Staff Reallocation' }
      default:
        return { icon: CheckCircle, color: 'bg-green-100 text-green-600', label: 'General' }
    }
  }

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'critical':
        return { color: 'bg-red-500', label: 'Critical' }
      case 'high':
        return { color: 'bg-orange-500', label: 'High' }
      case 'medium':
        return { color: 'bg-yellow-500', label: 'Medium' }
      case 'low':
        return { color: 'bg-green-500', label: 'Low' }
      default:
        return { color: 'bg-gray-500', label: 'Normal' }
    }
  }

  return (
    <Card title="Resource Recommendations" className="animate-fade-in">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {displayRecommendations.map((rec) => {
          const typeConfig = getTypeConfig(rec.type)
          const priorityConfig = getPriorityConfig(rec.priority)
          const TypeIcon = typeConfig.icon
          return (
            <div
              key={rec.id}
              className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', typeConfig.color)}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{typeConfig.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {rec.type === 'transfer' && `${rec.from} → ${rec.to}`}
                      {rec.type === 'procure' && `For ${rec.center}`}
                      {rec.type === 'staff' && `${rec.from} → ${rec.to}`}
                    </p>
                  </div>
                </div>
                <span className={cn('text-xs font-medium px-2 py-1 rounded-full text-white', priorityConfig.color)}>
                  {priorityConfig.label}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Item:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{rec.item || rec.role}</span>
                  {rec.quantity && (
                    <span className="text-gray-500 dark:text-gray-400">× {rec.quantity}</span>
                  )}
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Reason:</span>
                  <span className="text-gray-900 dark:text-white flex-1">{rec.reason}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Impact:</span>
                  <span className="text-green-600 dark:text-green-400 font-medium flex-1">{rec.estimatedImpact}</span>
                </div>
              </div>

              <button className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
                <span>Execute</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
