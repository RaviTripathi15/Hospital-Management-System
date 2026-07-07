import React, { useState } from 'react'
import { Bed, Users, TrendingUp, AlertTriangle, Search } from 'lucide-react'
import Card from '@/components/ui/Card'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

export default function BedAvailability({ beds = [] }) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data
  const mockBeds = [
    { id: 1, center: 'City Hospital', total: 100, occupied: 85, available: 15, icu: 10, icuOccupied: 8 },
    { id: 2, center: 'Community Health Center', total: 50, occupied: 35, available: 15, icu: 5, icuOccupied: 2 },
    { id: 3, center: 'District Hospital', total: 200, occupied: 180, available: 20, icu: 20, icuOccupied: 18 },
    { id: 4, center: 'Primary Health Center', total: 30, occupied: 20, available: 10, icu: 2, icuOccupied: 1 },
    { id: 5, center: 'Sub Center', total: 20, occupied: 12, available: 8, icu: 0, icuOccupied: 0 },
  ]

  const displayBeds = beds.length > 0 ? beds : mockBeds

  const filteredBeds = displayBeds.filter(bed =>
    bed.center.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalBeds = displayBeds.reduce((sum, bed) => sum + bed.total, 0)
  const totalOccupied = displayBeds.reduce((sum, bed) => sum + bed.occupied, 0)
  const totalAvailable = displayBeds.reduce((sum, bed) => sum + bed.available, 0)
  const occupancyRate = ((totalOccupied / totalBeds) * 100).toFixed(1)

  const getOccupancyColor = (occupied, total) => {
    const rate = (occupied / total) * 100
    if (rate >= 90) return 'bg-red-500'
    if (rate >= 70) return 'bg-orange-500'
    if (rate >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getOccupancyStatus = (occupied, total) => {
    const rate = (occupied / total) * 100
    if (rate >= 90) return { label: 'Critical', color: 'text-red-600' }
    if (rate >= 70) return { label: 'High', color: 'text-orange-600' }
    if (rate >= 50) return { label: 'Moderate', color: 'text-yellow-600' }
    return { label: 'Available', color: 'text-green-600' }
  }

  return (
    <Card title={t('navigation.beds')} className="animate-fade-in">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search health center..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Bed className="w-5 h-5 mx-auto mb-1 text-primary-600" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBeds}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Beds</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Users className="w-5 h-5 mx-auto mb-1 text-green-600" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAvailable}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Available</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-orange-600" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{occupancyRate}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Occupancy</p>
        </div>
      </div>

      {/* Bed List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {filteredBeds.map((bed) => {
          const status = getOccupancyStatus(bed.occupied, bed.total)
          const occupancyRate = ((bed.occupied / bed.total) * 100).toFixed(0)
          return (
            <div
              key={bed.id}
              className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{bed.center}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ICU: {bed.icuOccupied}/{bed.icu} available
                  </p>
                </div>
                <span className={cn('text-sm font-medium px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700', status.color)}>
                  {status.label}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Occupancy</span>
                  <span className="font-medium text-gray-900 dark:text-white">{occupancyRate}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all duration-500', getOccupancyColor(bed.occupied, bed.total))}
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Occupied: {bed.occupied}</span>
                  <span>Available: {bed.available}</span>
                  <span>Total: {bed.total}</span>
                </div>
              </div>

              {occupancyRate >= 90 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Near capacity - consider diversion</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
