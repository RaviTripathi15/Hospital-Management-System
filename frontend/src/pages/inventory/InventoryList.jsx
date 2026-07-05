import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import inventoryService from '@/services/inventoryService'
import healthCenterService from '@/services/healthCenterService'
import { usePermissions } from '@/hooks/usePermissions'
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Building,
  TrendingDown,
  Trash2,
  Edit,
  ChevronRight,
  TrendingUp,
  FileText,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { INVENTORY_CATEGORIES } from '@/utils/constants'

export default function InventoryList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isSuperAdmin, isDistrictAdmin, isStaff } = usePermissions()

  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [centers, setCenters] = useState([])
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [centerFilter, setCenterFilter] = useState('')

  // Aggregated Stats
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    criticalStock: 0,
    expiringSoon: 0,
  })

  const fetchCenters = async () => {
    if (!isSuperAdmin && !isDistrictAdmin) return
    try {
      const response = await healthCenterService.getAll({ limit: 100 })
      const data = response.data || response.results || response || []
      setCenters(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchInventory = async () => {
    setIsLoading(true)
    try {
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (categoryFilter) params.category = categoryFilter
      if (centerFilter) params.healthCenter = centerFilter
      params.limit = 100 // fetch a large batch for summary analysis

      const response = await inventoryService.getAll(params)
      const data = response.data || response.results || response || []
      setItems(data)

      // Calculate stats locally from the fetched batch
      let low = 0, critical = 0, expiring = 0
      const now = new Date()
      const ninetyDaysFromNow = new Date()
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)

      data.forEach((i) => {
        if (i.currentStock <= i.minStockLevel) {
          low++
          if (i.currentStock === 0) critical++
        }
        if (i.expiryDate) {
          const expDate = new Date(i.expiryDate)
          if (expDate <= ninetyDaysFromNow && expDate >= now && i.currentStock > 0) {
            expiring++
          }
        }
      })

      setStats({
        totalItems: data.length,
        lowStock: low,
        criticalStock: critical,
        expiringSoon: expiring,
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to load inventory logs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCenters()
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [searchTerm, categoryFilter, centerFilter])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) {
      return
    }

    try {
      await inventoryService.delete(id)
      toast.success('Inventory item deleted')
      fetchInventory()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete item')
    }
  }

  const getUrgencyBadge = (item) => {
    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date()
    
    if (item.currentStock === 0) {
      return (
        <span className="badge bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400">
          Out of Stock
        </span>
      )
    }
    if (item.currentStock <= item.minStockLevel) {
      return (
        <span className="badge bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400">
          Low Stock
        </span>
      )
    }
    if (isExpired) {
      return (
        <span className="badge bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400">
          Expired
        </span>
      )
    }
    return (
      <span className="badge bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400">
        In Stock
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            Medicine & Asset Inventory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track medicine stock levels, batch expiries, automated low stock alert thresholds, and daily usages
          </p>
        </div>
        <Link
          to="/inventory/add"
          className="btn-primary inline-flex items-center gap-2 text-sm justify-center self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </Link>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="card p-5 bg-white dark:bg-gray-800 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Items</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</span>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="card p-5 bg-white dark:bg-gray-800 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Low Stock Alert</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.lowStock}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
              Requires immediate restocking
            </span>
          </div>
        </div>

        {/* Critical Warnings */}
        <div className="card p-5 bg-white dark:bg-gray-800 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Critical Stock</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.criticalStock}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
              Out of stock (0 units remaining)
            </span>
          </div>
        </div>

        {/* Soon Expiring Items */}
        <div className="card p-5 bg-white dark:bg-gray-800 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Expiring soon</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expiringSoon}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
              Expires within 90 days
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 bg-white dark:bg-gray-800 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search item name, generic formula, batch code..."
            className="input-field pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-48">
          <select
            className="input-field"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {INVENTORY_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Health Center Filter */}
        {(isSuperAdmin || isDistrictAdmin) && (
          <div className="w-full md:w-56">
            <select
              className="input-field"
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
            >
              <option value="">All Health Centers</option>
              {centers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
          <p className="text-sm">Loading stock inventory logs...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No inventory items found</p>
          <p className="text-sm text-gray-400 mt-1">Add items or change your filters to explore stock details.</p>
        </div>
      ) : (
        <div className="card bg-white dark:bg-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-150 dark:border-gray-700">
                  <th className="table-header">Item Details</th>
                  <th className="table-header">Category</th>
                  {(!isStaff || isSuperAdmin || isDistrictAdmin) && (
                    <th className="table-header">Health Center</th>
                  )}
                  <th className="table-header">Remaining Stock</th>
                  <th className="table-header text-center">Daily Usage</th>
                  <th className="table-header">Expiry Date</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((i) => {
                  const percent = Math.min(100, Math.round((i.currentStock / (i.maxStockLevel || 1000)) * 100))
                  const isLow = i.currentStock <= i.minStockLevel

                  return (
                    <tr
                      key={i._id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/10 transition-colors"
                    >
                      <td className="table-cell">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white break-words">{i.itemName}</p>
                          {i.genericName && (
                            <p className="text-xs text-gray-400 italic font-medium">{i.genericName}</p>
                          )}
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">Code: {i.itemCode}</p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300">
                          {i.category}
                        </span>
                      </td>
                      {(!isStaff || isSuperAdmin || isDistrictAdmin) && (
                        <td className="table-cell">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {i.healthCenter?.name || 'N/A'}
                          </span>
                        </td>
                      )}
                      <td className="table-cell min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {i.currentStock} {i.unit}
                            </span>
                            <span className="text-gray-400">/ {i.maxStockLevel || 1000}</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isLow ? 'bg-orange-500' : 'bg-primary-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1">
                          {i.dailyUsage > 0 ? (
                            <>
                              <TrendingDown className="w-3.5 h-3.5 text-orange-500" />
                              {i.dailyUsage} {i.unit}/day
                            </>
                          ) : (
                            'N/A'
                          )}
                        </span>
                      </td>
                      <td className="table-cell">
                        {i.expiryDate ? (
                          <span
                            className={`text-xs ${
                              new Date(i.expiryDate) < new Date()
                                ? 'text-red-500 font-bold'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {new Date(i.expiryDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="table-cell">{getUrgencyBadge(i)}</td>
                      <td className="table-cell text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/inventory/${i._id}`}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="View Restock Details"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                          {(isSuperAdmin || isDistrictAdmin || isStaff) && (
                            <button
                              onClick={() => navigate(`/inventory/add?edit=${i._id}`)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                              title="Edit item"
                            >
                              <Edit className="w-4.5 h-4.5" />
                            </button>
                          )}
                          {(isSuperAdmin || isDistrictAdmin) && (
                            <button
                              onClick={() => handleDelete(i._id)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
