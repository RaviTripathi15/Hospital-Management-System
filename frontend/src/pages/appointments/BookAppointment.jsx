import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import appointmentService from '@/services/appointmentService'
import patientService from '@/services/patientService'
import healthCenterService from '@/services/healthCenterService'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const SLOTS = [
  '09:00 - 09:30',
  '09:30 - 10:00',
  '10:00 - 10:30',
  '10:30 - 11:00',
  '11:00 - 11:30',
  '11:30 - 12:00',
  '14:00 - 14:30',
  '14:30 - 15:00',
  '15:00 - 15:30',
  '15:30 - 16:00',
]

const CONSULT_TYPES = [
  { value: 'OPD', label: 'General OPD' },
  { value: 'Pediatrics', label: 'Pediatrics' },
  { value: 'Emergency', label: 'Emergency' },
  { value: 'Gynaecology', label: 'Gynaecology' },
  { value: 'Dental', label: 'Dental Clinic' },
  { value: 'Vaccination', label: 'Vaccination' },
  { value: 'Custom', label: 'Custom consultation' },
]

export default function BookAppointment() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isSuperAdmin, isDistrictAdmin, isCitizen } = usePermissions()

  const [patients, setPatients] = useState([])
  const [centers, setCenters] = useState([])
  const [doctors, setDoctors] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)

  // Form State
  const [formData, setFormData] = useState({
    patient: '',
    healthCenter: '',
    doctor: '',
    date: '',
    timeSlot: '',
    type: 'OPD',
    symptomsText: '',
  })

  // Pre-fill center for staff
  useEffect(() => {
    if (user && !isSuperAdmin && !isDistrictAdmin) {
      const userCenterId = user.healthCenter?._id || user.healthCenter || ''
      setFormData((prev) => ({
        ...prev,
        healthCenter: userCenterId,
      }))
    }
  }, [user, isSuperAdmin, isDistrictAdmin])

  // Load Patients list
  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoadingPatients(true)
      try {
        let response
        if (isCitizen) {
          response = await patientService.getMyProfile()
        } else {
          response = await patientService.getAll({ limit: 100 })
        }
        const data = response.data || response.results || response || []
        setPatients(data)
        // Auto-select if there is only one patient
        if (data.length === 1) {
          setFormData((prev) => ({
            ...prev,
            patient: data[0]._id,
          }))
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to load patients list')
      } finally {
        setIsLoadingPatients(false)
      }
    }
    if (user) {
      fetchPatients()
    }
  }, [isCitizen, user])

  // Load Health Centers (Admins and Citizens)
  useEffect(() => {
    const fetchCenters = async () => {
      if (isSuperAdmin || isDistrictAdmin || isCitizen) {
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
  }, [isSuperAdmin, isDistrictAdmin, isCitizen])

  // Load Doctors when center changes
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!formData.healthCenter) {
        setDoctors([])
        return
      }
      try {
        const response = await healthCenterService.getStaff(formData.healthCenter)
        // Handle response where staff might be array directly or nested
        const staffList = response.data?.staff || (Array.isArray(response.data) ? response.data : [])
        // Filter for doctor role or show all staff if roles aren't strict
        setDoctors(staffList)
      } catch (err) {
        console.error(err)
        // Non-fatal, just clear doctors list
        setDoctors([])
      }
    }
    fetchDoctors()
  }, [formData.healthCenter])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.patient) return toast.error('Please select a patient')
    if (!formData.healthCenter) return toast.error('Please select a health center')
    if (!formData.date) return toast.error('Please select a date')
    if (!formData.timeSlot) return toast.error('Please select a time slot')

    setIsSaving(true)
    try {
      const submissionData = {
        ...formData,
        symptoms: formData.symptomsText.split(',').map((s) => s.trim()).filter(Boolean),
        doctor: formData.doctor || undefined, // make optional
      }
      delete submissionData.symptomsText

      await appointmentService.create(submissionData)
      toast.success('Appointment booked successfully')
      navigate('/appointments')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to book appointment')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/appointments')}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book Consult Appointment</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Create a scheduled check-up or OPD slot for a patient.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-2">
            Appointment Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Select */}
            <div>
              <label className="label">Select Patient *</label>
              {isLoadingPatients ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 input">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-500" /> Loading patients...
                </div>
              ) : (
                <select
                  name="patient"
                  className="input"
                  required
                  value={formData.patient}
                  onChange={handleInputChange}
                >
                  <option value="">Choose Patient</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.patientId || p.phone})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Health Center */}
            <div>
              <label className="label">Health Center *</label>
              {isSuperAdmin || isDistrictAdmin || isCitizen ? (
                <select
                  name="healthCenter"
                  className="input"
                  required
                  value={formData.healthCenter}
                  onChange={handleInputChange}
                >
                  <option value="">Choose Health Center</option>
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

            {/* Doctor Select */}
            <div>
              <label className="label">Assigned Doctor (Optional)</label>
              <select
                name="doctor"
                className="input"
                value={formData.doctor}
                onChange={handleInputChange}
                disabled={!formData.healthCenter}
              >
                <option value="">Any Available Doctor / Staff</option>
                {doctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.name} ({doc.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Consult Type */}
            <div>
              <label className="label">Consultation Type *</label>
              <select
                name="type"
                className="input"
                required
                value={formData.type}
                onChange={handleInputChange}
              >
                {CONSULT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Pick */}
            <div>
              <label className="label">Appointment Date *</label>
              <input
                type="date"
                name="date"
                className="input"
                required
                min={new Date().toISOString().split('T')[0]}
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>

            {/* Time Slot */}
            <div>
              <label className="label">Select Time Slot *</label>
              <select
                name="timeSlot"
                className="input"
                required
                value={formData.timeSlot}
                onChange={handleInputChange}
              >
                <option value="">Choose Time Slot</option>
                {SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="label">Symptoms (comma separated)</label>
            <input
              type="text"
              name="symptomsText"
              className="input"
              placeholder="e.g. Fever, Cough, Chest tightness"
              value={formData.symptomsText}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/appointments')}
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
                Booking...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Book Appointment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
