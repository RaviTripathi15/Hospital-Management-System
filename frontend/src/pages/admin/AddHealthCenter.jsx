import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import healthCenterService from '@/services/healthCenterService'
import { healthCenterSchema } from '@/utils/validators'
import { ArrowLeft, Loader2, Save, Building, Phone, Mail, MapPin, Bed, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { CENTER_TYPES } from '@/utils/constants'

export default function AddHealthCenter() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(healthCenterSchema),
    defaultValues: {
      name: '',
      type: 'PHC',
      district: '',
      block: '',
      address: '',
      contactNumber: '',
      email: '',
      totalBeds: 0,
      availableBeds: 0,
      doctorCount: 0,
      staffCount: 0,
      operationalStatus: 'active',
      latitude: '',
      longitude: '',
    },
  })

  useEffect(() => {
    if (editId) {
      setIsEditMode(true)
      fetchCenterDetails()
    }
  }, [editId])

  const fetchCenterDetails = async () => {
    setIsLoading(true)
    try {
      const response = await healthCenterService.getById(editId)
      const c = response.data || response
      reset({
        name: c.name || '',
        type: c.type || 'PHC',
        district: c.district || '',
        block: c.block || '',
        address: c.address?.street || c.fullAddress || '',
        contactNumber: c.contactNumber || '',
        email: c.email || '',
        totalBeds: c.totalBeds || c.bedCapacity || 0,
        availableBeds: c.availableBeds || 0,
        doctorCount: c.doctorCount || 0,
        staffCount: c.staffCount || 0,
        operationalStatus: c.operationalStatus || 'active',
        latitude: c.coordinates?.lat || '',
        longitude: c.coordinates?.lng || '',
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to load facility data')
      navigate('/admin/centers')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const payload = {
        name: data.name.trim(),
        type: data.type,
        district: data.district.trim(),
        block: data.block.trim(),
        address: {
          street: data.address.trim(),
          city: data.block.trim(),
          state: 'Bihar',
          pincode: '',
        },
        contactNumber: data.contactNumber.trim(),
        email: data.email?.trim() || undefined,
        totalBeds: Number(data.totalBeds),
        availableBeds: Number(data.availableBeds),
        doctorCount: Number(data.doctorCount),
        staffCount: Number(data.staffCount),
        operationalStatus: data.operationalStatus,
        coordinates: {
          lat: data.latitude !== undefined && data.latitude !== '' ? Number(data.latitude) : null,
          lng: data.longitude !== undefined && data.longitude !== '' ? Number(data.longitude) : null,
        },
      }

      if (isEditMode) {
        await healthCenterService.update(editId, payload)
        toast.success(t('common.updateSuccess') || 'Health center updated')
      } else {
        await healthCenterService.create(payload)
        toast.success(t('common.createSuccess') || 'Health center created')
      }
      navigate('/admin/centers')
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
        <p className="text-sm">Loading facility details...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/centers"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {isEditMode ? 'Edit Health Center' : 'Add Health Center'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isEditMode ? 'Modify facility operational details and metadata' : 'Configure and register a new primary healthcare center'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Card */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2">
            <Building className="w-5 h-5 text-primary-500" />
            General Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Center Name */}
            <div>
              <label className="label" htmlFor="name">
                Center Name
              </label>
              <input
                id="name"
                type="text"
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            {/* Center Type */}
            <div>
              <label className="label" htmlFor="type">
                Center Type
              </label>
              <select
                id="type"
                className="input-field"
                {...register('type')}
              >
                {CENTER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* District */}
            <div>
              <label className="label" htmlFor="district">
                District
              </label>
              <input
                id="district"
                type="text"
                className={`input-field ${errors.district ? 'border-red-500' : ''}`}
                {...register('district')}
              />
              {errors.district && <p className="text-xs text-red-500 mt-1">{errors.district.message}</p>}
            </div>

            {/* Block */}
            <div>
              <label className="label" htmlFor="block">
                Block
              </label>
              <input
                id="block"
                type="text"
                className={`input-field ${errors.block ? 'border-red-500' : ''}`}
                {...register('block')}
              />
              {errors.block && <p className="text-xs text-red-500 mt-1">{errors.block.message}</p>}
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="label" htmlFor="address">
              Street Address
            </label>
            <input
              id="address"
              type="text"
              className={`input-field ${errors.address ? 'border-red-500' : ''}`}
              {...register('address')}
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>
        </div>

        {/* Contact Info & Coordinates Card */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2">
            <MapPin className="w-5 h-5 text-primary-500" />
            Contact & Geographical Coordinates
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Number */}
            <div>
              <label className="label" htmlFor="contactNumber">
                Contact Phone
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  id="contactNumber"
                  type="text"
                  className={`input-field pl-9 ${errors.contactNumber ? 'border-red-500' : ''}`}
                  {...register('contactNumber')}
                />
              </div>
              {errors.contactNumber && <p className="text-xs text-red-500 mt-1">{errors.contactNumber.message}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label className="label" htmlFor="email">
                Contact Email (Optional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  className={`input-field pl-9 ${errors.email ? 'border-red-500' : ''}`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Latitude */}
            <div>
              <label className="label" htmlFor="latitude">
                Latitude (Optional)
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                className={`input-field ${errors.latitude ? 'border-red-500' : ''}`}
                {...register('latitude')}
              />
              {errors.latitude && <p className="text-xs text-red-500 mt-1">{errors.latitude.message}</p>}
            </div>

            {/* Longitude */}
            <div>
              <label className="label" htmlFor="longitude">
                Longitude (Optional)
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                className={`input-field ${errors.longitude ? 'border-red-500' : ''}`}
                {...register('longitude')}
              />
              {errors.longitude && <p className="text-xs text-red-500 mt-1">{errors.longitude.message}</p>}
            </div>
          </div>
        </div>

        {/* Capacity & Operational Status Card */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-2">
            <Bed className="w-5 h-5 text-primary-500" />
            Operational Capacity & Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Beds */}
            <div>
              <label className="label" htmlFor="totalBeds">
                Total Bed Capacity
              </label>
              <input
                id="totalBeds"
                type="number"
                className={`input-field ${errors.totalBeds ? 'border-red-500' : ''}`}
                {...register('totalBeds')}
              />
              {errors.totalBeds && <p className="text-xs text-red-500 mt-1">{errors.totalBeds.message}</p>}
            </div>

            {/* Available Beds */}
            <div>
              <label className="label" htmlFor="availableBeds">
                Available Beds
              </label>
              <input
                id="availableBeds"
                type="number"
                className={`input-field ${errors.availableBeds ? 'border-red-500' : ''}`}
                {...register('availableBeds')}
              />
              {errors.availableBeds && <p className="text-xs text-red-500 mt-1">{errors.availableBeds.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Doctor Count */}
            <div>
              <label className="label" htmlFor="doctorCount">
                Doctor Count
              </label>
              <input
                id="doctorCount"
                type="number"
                className={`input-field ${errors.doctorCount ? 'border-red-500' : ''}`}
                {...register('doctorCount')}
              />
              {errors.doctorCount && <p className="text-xs text-red-500 mt-1">{errors.doctorCount.message}</p>}
            </div>

            {/* Staff Count */}
            <div>
              <label className="label" htmlFor="staffCount">
                Staff Count
              </label>
              <input
                id="staffCount"
                type="number"
                className={`input-field ${errors.staffCount ? 'border-red-500' : ''}`}
                {...register('staffCount')}
              />
              {errors.staffCount && <p className="text-xs text-red-500 mt-1">{errors.staffCount.message}</p>}
            </div>

            {/* Facility Status */}
            <div>
              <label className="label" htmlFor="operationalStatus">
                Facility Status
              </label>
              <select
                id="operationalStatus"
                className="input-field"
                {...register('operationalStatus')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          <Link to="/admin/centers" className="btn-secondary">
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
                {isEditMode ? 'Update Center' : 'Save Center'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
