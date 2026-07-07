import React, { useState } from 'react'
import { Pill, TrendingUp, TrendingDown, AlertTriangle, Search, Filter } from 'lucide-react'
import Card from '@/components/ui/Card'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

export default function MedicineStatus({ medicines = [] }) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Mock data if empty
  const mockMedicines = [
    { id: 1, name: 'Paracetamol', category: 'Medicine', stock: 150, maxStock: 500, expiry: '2025-12-30', trend: 12 },
    { id: 2, name: 'Amoxicillin', category: 'Medicine', stock: 45, maxStock: 300, expiry: '2025-08-15', trend: -8 },
    { id: 3, name: 'ORS Sachets', category: 'Consumable', stock: 20, maxStock: 200, expiry: '2025-07-20', trend: -15 },
    { id: 4, name: 'Insulin', category: 'Medicine', stock: 80, maxStock: 150, expiry: '2026-01-10', trend: 5 },
    { id: 5, name: 'Vitamin C', category: 'Medicine', stock: 200, maxStock: 400, expiry: '2026-03-25', trend: 18 },
  ]

  const displayMedicines = medicines.length > 0 ? medicines : mockMedicines

  const filteredMedicines = displayMedicines.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase())
    const stockPercentage = (med.stock / med.maxStock) * 100
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'low' && stockPercentage < 30) ||
      (filterStatus === 'critical' && stockPercentage < 10) ||
      (filterStatus === 'good' && stockPercentage >= 70)
    return matchesSearch && matchesFilter
  })

  const getStockStatus = (stock, max) => {
    const percentage = (stock / max) * 100
    if (percentage < 10) return { label: 'Critical', color: 'bg-red-500', textColor: 'text-red-600' }
    if (percentage < 30) return { label: 'Low', color: 'bg-orange-500', textColor: 'text-orange-600' }
    if (percentage < 70) return { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-600' }
    return { label: 'Good', color: 'bg-green-500', textColor: 'text-green-600' }
  }

  return (
    <Card title={t('inventory.title')} className="animate-fade-in">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Status</option>
            <option value="critical">Critical</option>
            <option value="low">Low Stock</option>
            <option value="good">Good Stock</option>
          </select>
        </div>
      </div>

      {/* Medicine List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredMedicines.map((med) => {
          const status = getStockStatus(med.stock, med.maxStock)
          const stockPercentage = (med.stock / med.maxStock) * 100
          return (
            <div
              key={med.id}
              className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Pill className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{med.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{med.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {med.trend > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : med.trend < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : null}
                  <span className={cn('text-sm font-medium', med.trend > 0 ? 'text-green-600' : med.trend < 0 ? 'text-red-600' : 'text-gray-600')}>
                    {med.trend > 0 ? '+' : ''}{med.trend}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Stock: {med.stock}/{med.maxStock}</span>
                  <span className={cn('font-medium', status.textColor)}>{status.label}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all duration-500', status.color)}
                    style={{ width: `${stockPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <span>Expiry: {new Date(med.expiry).toLocaleDateString()}</span>
                  {stockPercentage < 30 && (
                    <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                      <AlertTriangle className="w-3 h-3" />
                      Restock needed
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
