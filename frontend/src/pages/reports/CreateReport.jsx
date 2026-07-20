import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import reportService from '@/services/reportService'
import healthCenterService from '@/services/healthCenterService'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateReport() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isSuperAdmin, isDistrictAdmin } = usePermissions()

  const [centers, setCenters] = useState([])
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    healthCenter: '',
    reportType: 'monthly',
    startDate: '',
    endDate: '',
    notes: '',
    metrics: {
      patientsServed: 0,
      appointmentsCompleted: 0,
      appointmentsCancelled: 0,
      newPatients: 0,
      emergencyCases: 0,
      referralsMade: 0,
      lowStockAlerts: 0,
      outbreakAlerts: 0,
    },
  })

  useEffect(() => {
    if (user && !isSuperAdmin && !isDistrictAdmin) {
      setFormData((prev) => ({
        ...prev,
        healthCenter: user.healthCenter?._id || user.healthCenter || '',
      }))
    }
  }, [user, isSuperAdmin, isDistrictAdmin])

  useEffect(() => {
    const fetchCenters = async () => {
      if (isSuperAdmin || isDistrictAdmin) {
        try {
          const response = await healthCenterService.getAll({ limit: 100 })
          const data = response.data || response.results || response || []
          setCenters(data)
        } catch (err) {
          console.error(err)
          toast.error('Failed to load health centers')
        }
      }
    }
    fetchCenters()
  }, [isSuperAdmin, isDistrictAdmin])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleMetricChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [name]: Number(value) || 0,
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.healthCenter) return toast.error('Please select a health center')
    if (!formData.startDate || !formData.endDate) return toast.error('Please specify start and end dates')

    setIsSaving(true)
    try {
      const submissionData = {
        healthCenter: formData.healthCenter,
        reportType: formData.reportType,
        period: {
          startDate: formData.startDate,
          endDate: formData.endDate,
        },
        metrics: formData.metrics,
        notes: formData.notes || undefined,
      }

      await reportService.create(submissionData)
      toast.success('Report draft created successfully')
      navigate('/reports')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to create report')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/reports')}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compile New Report</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Fill in the clinical and administrative metrics to compile an operational report.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            General Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Health Center */}
            <div>
              <label className="label">Health Center *</label>
              {isSuperAdmin || isDistrictAdmin ? (
                <select
                  name="healthCenter"
                  className="input"
                  required
                  value={formData.healthCenter}
                  onChange={handleInputChange}
                >
                  <option value="">Select Health Center</option>
                  {centers.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="input bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                  disabled
                  value={user?.healthCenter?.name || 'My Health Center'}
                />
              )}
            </div>

            {/* Report Type */}
            <div>
              <label className="label">Report Type *</label>
              <select
                name="reportType"
                className="input"
                required
                value={formData.reportType}
                onChange={handleInputChange}
              >
                <option value="daily">Daily report</option>
                <option value="weekly">Weekly report</option>
                <option value="monthly">Monthly report</option>
                <option value="outbreak">Disease Outbreak summary</option>
              </select>
            </div>

            {/* Period Start */}
            <div>
              <label className="label">Period Start Date *</label>
              <input
                type="date"
                name="startDate"
                className="input"
                required
                value={formData.startDate}
                onChange={handleInputChange}
              />
            </div>

            {/* Period End */}
            <div>
              <label className="label">Period End Date *</label>
              <input
                type="date"
                name="endDate"
                className="input"
                required
                value={formData.endDate}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Metrics Card */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            Key Metrics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label text-xs">Patients Served</label>
              <input
                type="number"
                name="patientsServed"
                min="0"
                className="input text-sm"
                value={formData.metrics.patientsServed}
                onChange={handleMetricChange}
              />
            </div>

            <div>
              <label className="label text-xs">New Patient Registrations</label>
              <input
                type="number"
                name="newPatients"
                min="0"
                className="input text-sm"
                value={formData.metrics.newPatients}
                onChange={handleMetricChange}
              />
            </div>

            <div>
              <label className="label text-xs">Emergency Cases</label>
              <input
                type="number"
                name="emergencyCases"
                min="0"
                className="input text-sm"
                value={formData.metrics.emergencyCases}
                onChange={handleMetricChange}
              />
            </div>

            <div>
              <label className="label text-xs">Outward Referrals</label>
              <input
                type="number"
                name="referralsMade"
                min="0"
                className="input text-sm"
                value={formData.metrics.referralsMade}
                onChange={handleMetricChange}
              />
            </div>

            <div>
              <label className="label text-xs">Appointments Completed</label>
              <input
                type="number"
                name="appointmentsCompleted"
                min="0"
                className="input text-sm"
                value={formData.metrics.appointmentsCompleted}
                onChange={handleMetricChange}
              />
            </div>

            <div>
              <label className="label text-xs">Appointments Cancelled</label>
              <input
                type="number"
                name="appointmentsCancelled"
                min="0"
                className="input text-sm"
                value={formData.metrics.appointmentsCancelled}
                onChange={handleMetricChange}
              />
            </div>

            <div>
              <label className="label text-xs">Low Stock Alerts</label>
              <input
                type="number"
                name="lowStockAlerts"
                min="0"
                className="input text-sm"
                value={formData.metrics.lowStockAlerts}
                onChange={handleMetricChange}
              />
            </div>

            <div>
              <label className="label text-xs">Outbreak Alerts Raised</label>
              <input
                type="number"
                name="outbreakAlerts"
                min="0"
                className="input text-sm"
                value={formData.metrics.outbreakAlerts}
                onChange={handleMetricChange}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            Clinical Notes / Remarks
          </h2>
          <div>
            <textarea
              name="notes"
              className="input"
              rows="3"
              placeholder="Provide comments on patient care quality, supply challenges, or outbreak notes..."
              value={formData.notes}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="btn btn-secondary"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Draft...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Draft
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
