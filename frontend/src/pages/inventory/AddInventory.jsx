import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import inventoryService from '@/services/inventoryService'
import healthCenterService from '@/services/healthCenterService'
import { usePermissions } from '@/hooks/usePermissions'
import { inventorySchema } from '@/utils/validators'
import { ArrowLeft, Loader2, Save, Package, ShieldCheck, Mail, Calendar, Info, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { INVENTORY_CATEGORIES } from '@/utils/constants'

export default function AddInventory() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const { isSuperAdmin, isDistrictAdmin, user } = usePermissions()

  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [centers, setCenters] = useState([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      itemName: '',
      genericName: '',
      category: 'medicine',
      currentStock: 0,
      minStockLevel: 0,
      maxStockLevel: 1000,
      dailyUsage: 0,
      unit: '',
      expiryDate: '',
      batchNumber: '',
      supplierName: '',
      supplierContact: '',
      supplierEmail: '',
      unitCost: 0,
      storageConditions: 'Room temperature',
      healthCenter: '',
    },
  })

  const fetchCenters = async () => {
    try {
      const response = await healthCenterService.getAll({ limit: 100 })
      const data = response.data || response.results || response || []
      setCenters(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchItemDetails = async () => {
    setIsLoading(true)
    try {
      const response = await inventoryService.getById(editId)
      const i = response.data || response
      reset({
        itemName: i.itemName || '',
        genericName: i.genericName || '',
        category: i.category || 'medicine',
        currentStock: i.currentStock || 0,
        minStockLevel: i.minStockLevel || 0,
        maxStockLevel: i.maxStockLevel || 1000,
        dailyUsage: i.dailyUsage || 0,
        unit: i.unit || '',
        expiryDate: i.expiryDate ? i.expiryDate.split('T')[0] : '',
        batchNumber: i.batchNumber || '',
        supplierName: i.supplier?.name || '',
        supplierContact: i.supplier?.contact || '',
        supplierEmail: i.supplier?.email || '',
        unitCost: i.unitCost || 0,
        storageConditions: i.storageConditions || 'Room temperature',
        healthCenter: i.healthCenter?._id || i.healthCenter || '',
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to load item details')
      navigate('/inventory')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      await fetchCenters()
      
      // If staff user, set their pre-configured health center automatically
      if (user?.healthCenter) {
        setValue('healthCenter', user.healthCenter._id || user.healthCenter)
      }

      if (editId) {
        setIsEditMode(true)
        await fetchItemDetails()
      }
    }
    initialize()
  }, [editId, user])

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const payload = {
        itemName: data.itemName.trim(),
        genericName: data.genericName?.trim() || undefined,
        category: data.category,
        currentStock: Number(data.currentStock),
        minStockLevel: Number(data.minStockLevel),
        maxStockLevel: Number(data.maxStockLevel),
        dailyUsage: Number(data.dailyUsage),
        unit: data.unit.trim(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        batchNumber: data.batchNumber?.trim() || undefined,
        supplier: {
          name: data.supplierName?.trim() || undefined,
          contact: data.supplierContact?.trim() || undefined,
          email: data.supplierEmail?.trim() || undefined,
        },
        unitCost: Number(data.unitCost),
        storageConditions: data.storageConditions?.trim() || 'Room temperature',
        healthCenter: data.healthCenter,
      }

      if (isEditMode) {
        await inventoryService.update(editId, payload)
        toast.success('Inventory item updated')
      } else {
        await inventoryService.create(payload)
        toast.success('Inventory item created')
      }
      navigate('/inventory')
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.message || t('common.error')
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
        <p className="text-sm">Loading inventory logs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/inventory"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {isEditMode ? 'Edit Stock Item' : 'Add Stock Item'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isEditMode ? 'Modify inventory properties and alert levels' : 'Add new medical items, vaccines, or assets to inventory logs'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Item Information Card */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2">
            <Package className="w-5 h-5 text-primary-500" />
            General Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Item Name */}
            <div>
              <label className="label" htmlFor="itemName">
                Item Name
              </label>
              <input
                id="itemName"
                type="text"
                className={`input-field ${errors.itemName ? 'border-red-500' : ''}`}
                {...register('itemName')}
              />
              {errors.itemName && <p className="text-xs text-red-500 mt-1">{errors.itemName.message}</p>}
            </div>

            {/* Generic Formula */}
            <div>
              <label className="label" htmlFor="genericName">
                Generic Name (Chemical Formula)
              </label>
              <input
                id="genericName"
                type="text"
                className={`input-field ${errors.genericName ? 'border-red-500' : ''}`}
                {...register('genericName')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="label" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                className="input-field"
                {...register('category')}
              >
                <option value="medicine">Medicines</option>
                <option value="equipment">Equipment</option>
                <option value="consumable">Consumables</option>
                <option value="vaccine">Vaccines</option>
                <option value="reagent">Reagents</option>
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="label" htmlFor="unit">
                Unit of Measurement
              </label>
              <input
                id="unit"
                type="text"
                placeholder="e.g. Tablets, Vials, Pieces"
                className={`input-field ${errors.unit ? 'border-red-500' : ''}`}
                {...register('unit')}
              />
              {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit.message}</p>}
            </div>

            {/* Health Center Selection */}
            <div>
              <label className="label" htmlFor="healthCenter">
                Allocated Health Center
              </label>
              <select
                id="healthCenter"
                className={`input-field ${errors.healthCenter ? 'border-red-500' : ''}`}
                disabled={!!user?.healthCenter}
                {...register('healthCenter')}
              >
                <option value="">Choose Health Center...</option>
                {centers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.healthCenter && <p className="text-xs text-red-500 mt-1">{errors.healthCenter.message}</p>}
            </div>
          </div>
        </div>

        {/* Quantities & Automated Alerts Card */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2">
            <Info className="w-5 h-5 text-primary-500" />
            Quantities & Stock Alerts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Current Stock */}
            <div>
              <label className="label" htmlFor="currentStock">
                Current Stock Quantity
              </label>
              <input
                id="currentStock"
                type="number"
                disabled={isEditMode} // Quick stock adjustments are done on details/log page to maintain restock logs
                className={`input-field ${errors.currentStock ? 'border-red-500' : ''}`}
                {...register('currentStock')}
              />
              {errors.currentStock && <p className="text-xs text-red-500 mt-1">{errors.currentStock.message}</p>}
            </div>

            {/* Min Stock Level */}
            <div>
              <label className="label" htmlFor="minStockLevel">
                Min Stock Level (Alert Trigger)
              </label>
              <input
                id="minStockLevel"
                type="number"
                className={`input-field ${errors.minStockLevel ? 'border-red-500' : ''}`}
                {...register('minStockLevel')}
              />
              {errors.minStockLevel && <p className="text-xs text-red-500 mt-1">{errors.minStockLevel.message}</p>}
            </div>

            {/* Max Stock Level */}
            <div>
              <label className="label" htmlFor="maxStockLevel">
                Max Stock Level
              </label>
              <input
                id="maxStockLevel"
                type="number"
                className={`input-field ${errors.maxStockLevel ? 'border-red-500' : ''}`}
                {...register('maxStockLevel')}
              />
            </div>

            {/* Daily Usage */}
            <div>
              <label className="label" htmlFor="dailyUsage">
                Daily Usage Rate
              </label>
              <input
                id="dailyUsage"
                type="number"
                className={`input-field ${errors.dailyUsage ? 'border-red-500' : ''}`}
                {...register('dailyUsage')}
              />
              {errors.dailyUsage && <p className="text-xs text-red-500 mt-1">{errors.dailyUsage.message}</p>}
            </div>
          </div>
        </div>

        {/* Expiry, Cost, Supplier Info Card */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            Expiry, Cost & Supplier Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Expiry Date */}
            <div className="md:col-span-2">
              <label className="label" htmlFor="expiryDate">
                Expiry Date
              </label>
              <input
                id="expiryDate"
                type="date"
                className="input-field"
                {...register('expiryDate')}
              />
            </div>

            {/* Batch Number */}
            <div>
              <label className="label" htmlFor="batchNumber">
                Batch Number
              </label>
              <input
                id="batchNumber"
                type="text"
                placeholder="e.g. B-90X"
                className="input-field"
                {...register('batchNumber')}
              />
            </div>

            {/* Unit Cost */}
            <div>
              <label className="label" htmlFor="unitCost">
                Unit Cost (Price)
              </label>
              <input
                id="unitCost"
                type="number"
                step="any"
                className="input-field"
                {...register('unitCost')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Supplier Name */}
            <div>
              <label className="label" htmlFor="supplierName">
                Supplier Name
              </label>
              <input
                id="supplierName"
                type="text"
                className="input-field"
                {...register('supplierName')}
              />
            </div>

            {/* Supplier Contact */}
            <div>
              <label className="label" htmlFor="supplierContact">
                Supplier Contact Phone
              </label>
              <input
                id="supplierContact"
                type="text"
                className="input-field"
                {...register('supplierContact')}
              />
            </div>

            {/* Supplier Email */}
            <div>
              <label className="label" htmlFor="supplierEmail">
                Supplier Email
              </label>
              <input
                id="supplierEmail"
                type="email"
                className={`input-field ${errors.supplierEmail ? 'border-red-500' : ''}`}
                {...register('supplierEmail')}
              />
              {errors.supplierEmail && <p className="text-xs text-red-500 mt-1">{errors.supplierEmail.message}</p>}
            </div>
          </div>

          {/* Storage Conditions */}
          <div>
            <label className="label" htmlFor="storageConditions">
              Storage Conditions
            </label>
            <input
              id="storageConditions"
              type="text"
              placeholder="e.g. Keep refrigerated, Room temperature"
              className="input-field"
              {...register('storageConditions')}
            />
          </div>
        </div>

        {/* Form actions */}
        <div className="flex justify-end gap-3">
          <Link to="/inventory" className="btn-secondary">
            {t('common.cancel')}
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? 'Update Item' : 'Save Item'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
