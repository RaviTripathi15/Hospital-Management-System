import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import inventoryService from '@/services/inventoryService'
import { usePermissions } from '@/hooks/usePermissions'
import {
  ArrowLeft,
  Package,
  Calendar,
  AlertTriangle,
  History,
  Activity,
  User,
  Plus,
  Minus,
  Save,
  CheckCircle,
  Truck,
  TrendingDown,
  Info,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function InventoryDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { isSuperAdmin, isDistrictAdmin, isStaff } = usePermissions()

  const [item, setItem] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingStock, setIsSubmittingStock] = useState(false)

  // Quick Adjustment Form States
  const [operation, setOperation] = useState('add')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  const fetchItem = async () => {
    setIsLoading(true)
    try {
      const response = await inventoryService.getById(id)
      setItem(response.data || response)
      
      // Default restock fields with current values
      setBatchNumber(response.data?.batchNumber || '')
      if (response.data?.expiryDate) {
        setExpiryDate(response.data.expiryDate.split('T')[0])
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load item log profile')
      navigate('/inventory')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItem()
  }, [id])

  const handleAdjustStock = async (e) => {
    e.preventDefault()
    if (quantity <= 0) {
      toast.error('Quantity must be greater than zero')
      return
    }

    setIsSubmittingStock(true)
    try {
      const payload = {
        quantity: Number(quantity),
        operation,
        notes: notes.trim(),
        batchNumber: batchNumber.trim() || undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      }

      await inventoryService.updateStock(id, payload)
      toast.success('Stock adjusted successfully')
      
      // Reset form fields
      setQuantity(1)
      setNotes('')
      
      // Re-fetch item to update stats & timeline
      fetchItem()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to adjust stock level')
    } finally {
      setIsSubmittingStock(false)
    }
  }

  const getUrgencyColor = () => {
    if (item.currentStock === 0) return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    if (item.currentStock <= item.minStockLevel) return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
    return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
        <p className="text-sm">Loading asset profiles...</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="card p-12 text-center text-gray-500">
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Item not found</p>
        <Link to="/inventory" className="btn-primary mt-4 inline-flex">Go back to inventory</Link>
      </div>
    )
  }

  const percent = Math.min(100, Math.round((item.currentStock / (item.maxStockLevel || 1000)) * 100))
  const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/inventory"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {item.itemName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Allocated at {item.healthCenter?.name || 'N/A'}
            </p>
          </div>
        </div>

        {(isSuperAdmin || isDistrictAdmin || isStaff) && (
          <Link
            to={`/inventory/add?edit=${item._id}`}
            className="btn-secondary inline-flex items-center gap-2 text-sm justify-center"
          >
            <Edit className="w-4 h-4" />
            Edit Metadata
          </Link>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Detail profiles & Adjustment form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="card p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-primary-500" />
                Asset Information
              </h2>
              <span className={`badge border text-[10px] font-bold ${getUrgencyColor()}`}>
                {item.currentStock === 0 ? 'Out of stock' : item.currentStock <= item.minStockLevel ? 'Low Stock' : 'Good Stock'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Item Name</span>
                  <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{item.itemName}</p>
                </div>
                {item.genericName && (
                  <div>
                    <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Generic Chemical Formula</span>
                    <p className="text-base font-medium text-gray-900 dark:text-white mt-0.5">{item.genericName}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Asset Category</span>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-0.5 uppercase">{item.category}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Item Code / Catalog Code</span>
                  <p className="text-base font-mono text-gray-900 dark:text-white mt-0.5">{item.itemCode || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Batch Code</span>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-0.5">{item.batchNumber || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Storage Conditions</span>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-0.5">{item.storageConditions || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Unit Cost</span>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-0.5">₹{item.unitCost?.toFixed(2) || '0.00'}</p>
                </div>
                {item.expiryDate && (
                  <div>
                    <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Expiry Date</span>
                    <p className={`text-base font-semibold mt-0.5 ${isExpired ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                      {new Date(item.expiryDate).toLocaleDateString()} {isExpired && '(EXPIRED)'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Restock History Timeline */}
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-3">
              <History className="w-5 h-5 text-primary-500" />
              Stock Audit Log
            </h3>

            {item.restockHistory?.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No historical logs recorded.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {item.restockHistory
                  ?.slice()
                  .reverse()
                  .map((log, idx) => {
                    const isAdd = log.operation === 'add'
                    const isSub = log.operation === 'subtract'
                    return (
                      <div key={idx} className="flex gap-3 relative pb-2 items-start border-l-2 border-dashed border-gray-200 dark:border-gray-700 pl-4 ml-3">
                        <div className={`absolute -left-2 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 ${
                          isAdd ? 'bg-green-500' : isSub ? 'bg-orange-500' : 'bg-blue-500'
                        }`} />
                        
                        <div className="flex-1 bg-gray-50 dark:bg-gray-700/20 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {isAdd ? '+' : isSub ? '-' : ''} {log.quantity} {item.unit} ({log.operation?.toUpperCase()})
                            </span>
                            <span className="text-gray-400 font-semibold">
                              {new Date(log.createdAt || log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          
                          {log.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                              "{log.notes}"
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2 border-t pt-1.5 border-dashed border-gray-200 dark:border-gray-700">
                            <span className="flex items-center gap-0.5">
                              <User className="w-3 h-3" />
                              By: {log.performedBy?.name || 'Automated System'}
                            </span>
                            <span>Stock after: {log.stockAfter}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick stock adjustment & Stats */}
        <div className="space-y-6">
          {/* Capacity stats card */}
          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b pb-2">
              Stock Occupancy
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                  <Activity className="w-4 h-4 text-gray-400" />
                  Remaining Stock
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {item.currentStock} {item.unit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    item.currentStock <= item.minStockLevel ? 'bg-orange-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 block text-right">
                {percent}% of max stock level ({item.maxStockLevel || 1000})
              </span>
            </div>

            {/* Daily Usage indicator */}
            {item.dailyUsage > 0 && (
              <div className="p-3 bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 rounded-xl flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-orange-500 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-gray-800 dark:text-gray-200">Daily usage: {item.dailyUsage} {item.unit}</span>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                    Estimated stock will last {Math.round(item.currentStock / item.dailyUsage)} days.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Adjustment Panel */}
          {(isSuperAdmin || isDistrictAdmin || isStaff) && (
            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b pb-2">
                Quick Adjust Stock
              </h3>

              <form onSubmit={handleAdjustStock} className="space-y-3.5">
                {/* Operation Mode */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOperation('add')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      operation === 'add'
                        ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800'
                        : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Restock
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperation('subtract')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      operation === 'subtract'
                        ? 'bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800'
                        : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    Dispense
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperation('set')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      operation === 'set'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800'
                        : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                    }`}
                  >
                    Set Total
                  </button>
                </div>

                {/* Quantity */}
                <div>
                  <label className="label" htmlFor="qty">
                    Quantity ({item.unit})
                  </label>
                  <input
                    id="qty"
                    type="number"
                    min="1"
                    className="input-field"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>

                {/* Batch Details (Optional, only visible when restocking) */}
                {operation === 'add' && (
                  <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/20 border border-dashed rounded-xl animate-fade-in">
                    <div>
                      <label className="label" htmlFor="batch">Batch Code</label>
                      <input
                        id="batch"
                        type="text"
                        placeholder="e.g. B-12"
                        className="input-field py-1.5 text-xs"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="expiry">Expiry Date</label>
                      <input
                        id="expiry"
                        type="date"
                        className="input-field py-1.5 text-xs"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="label" htmlFor="notes">
                    Reason / Notes
                  </label>
                  <textarea
                    id="notes"
                    rows="2"
                    placeholder="Provide details about this adjustment (audit log)"
                    className="input-field resize-none text-xs"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                  />
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={isSubmittingStock || quantity <= 0}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-2 text-xs"
                >
                  {isSubmittingStock ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Adjusting...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Apply Adjustment
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Supplier details card */}
          {item.supplier?.name && (
            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                <Truck className="w-4 h-4 text-gray-400" />
                Supplier Profile
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-gray-400 block">Supplier Name</span>
                  <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{item.supplier.name}</p>
                </div>
                {item.supplier.contact && (
                  <div>
                    <span className="text-gray-400 block">Phone</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{item.supplier.contact}</p>
                  </div>
                )}
                {item.supplier.email && (
                  <div>
                    <span className="text-gray-400 block">Email Address</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5 break-all">{item.supplier.email}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
