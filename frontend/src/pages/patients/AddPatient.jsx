import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import patientService from '@/services/patientService'
import healthCenterService from '@/services/healthCenterService'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AddPatient() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isSuperAdmin, isDistrictAdmin } = usePermissions()

  const [centers, setCenters] = useState([])
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    dob: '',
    age: '',
    phone: '',
    bloodGroup: '',
    aadhaarNumber: '',
    insuranceScheme: '',
    healthCenter: '',
    address: {
      street: '',
      village: '',
      block: '',
      district: '',
      state: 'Bihar',
      pincode: '',
    },
    emergencyContact: {
      name: '',
      relation: '',
      phone: '',
    },
  })

  // Pre-fill district and block for convenience based on logged in user
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        healthCenter: user.healthCenter?._id || user.healthCenter || '',
        address: {
          ...prev.address,
          district: user.district || '',
        },
      }))
    }
  }, [user])

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

  const handleAddressChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
      },
    }))
  }

  const handleEmergencyChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [name]: value,
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name) return toast.error('Patient name is required')
    if (!formData.gender) return toast.error('Gender is required')
    if (!formData.healthCenter) return toast.error('Health center selection is required')

    setIsSaving(true)
    try {
      // Calculate age if not set but DOB is set
      const submissionData = { ...formData }
      if (!submissionData.age && submissionData.dob) {
        const birth = new Date(submissionData.dob)
        const today = new Date()
        let calculatedAge = today.getFullYear() - birth.getFullYear()
        const m = today.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) calculatedAge--
        submissionData.age = calculatedAge
      }

      await patientService.create(submissionData)
      toast.success('Patient registered successfully')
      navigate('/patients')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to register patient')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/patients')}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Register New Patient</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Fill in the information to add a patient to the registry.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-2">
            Demographic Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                name="name"
                className="input"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="First and last name"
              />
            </div>

            <div>
              <label className="label">Gender *</label>
              <select
                name="gender"
                className="input"
                required
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Blood Group</label>
              <select
                name="bloodGroup"
                className="input"
                value={formData.bloodGroup}
                onChange={handleInputChange}
              >
                <option value="">Select Blood Group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Date of Birth</label>
              <input
                type="date"
                name="dob"
                className="input"
                value={formData.dob}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="label">Age (if DOB unknown)</label>
              <input
                type="number"
                name="age"
                className="input"
                min="0"
                max="150"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="Age in years"
              />
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="input"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div>
              <label className="label">Aadhaar Number</label>
              <input
                type="text"
                name="aadhaarNumber"
                className="input"
                maxLength="12"
                value={formData.aadhaarNumber}
                onChange={handleInputChange}
                placeholder="12 digit Aadhaar ID"
              />
            </div>

            <div>
              <label className="label">Government Health Scheme</label>
              <input
                type="text"
                name="insuranceScheme"
                className="input"
                value={formData.insuranceScheme}
                onChange={handleInputChange}
                placeholder="e.g. PM-JAY"
              />
            </div>

            <div>
              <label className="label">Assigned Health Center *</label>
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
          </div>
        </div>

        {/* Address Card */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-2">
            Address Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Village / Area</label>
              <input
                type="text"
                name="village"
                className="input"
                value={formData.address.village}
                onChange={handleAddressChange}
                placeholder="Village / Locality"
              />
            </div>

            <div>
              <label className="label">Block</label>
              <input
                type="text"
                name="block"
                className="input"
                value={formData.address.block}
                onChange={handleAddressChange}
                placeholder="Administrative Block"
              />
            </div>

            <div>
              <label className="label">District</label>
              <input
                type="text"
                name="district"
                className="input"
                value={formData.address.district}
                onChange={handleAddressChange}
                placeholder="District"
              />
            </div>

            <div>
              <label className="label">Street Address</label>
              <input
                type="text"
                name="street"
                className="input"
                value={formData.address.street}
                onChange={handleAddressChange}
                placeholder="Street / Lane"
              />
            </div>

            <div>
              <label className="label">State</label>
              <input
                type="text"
                name="state"
                className="input"
                value={formData.address.state}
                onChange={handleAddressChange}
              />
            </div>

            <div>
              <label className="label">Pincode</label>
              <input
                type="text"
                name="pincode"
                className="input"
                value={formData.address.pincode}
                onChange={handleAddressChange}
                placeholder="6-digit ZIP code"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-2">
            Emergency Contact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Contact Name</label>
              <input
                type="text"
                name="name"
                className="input"
                value={formData.emergencyContact.name}
                onChange={handleEmergencyChange}
                placeholder="Contact person's name"
              />
            </div>

            <div>
              <label className="label">Relation</label>
              <input
                type="text"
                name="relation"
                className="input"
                value={formData.emergencyContact.relation}
                onChange={handleEmergencyChange}
                placeholder="Spouse, Parent, Child, etc."
              />
            </div>

            <div>
              <label className="label">Contact Phone</label>
              <input
                type="tel"
                name="phone"
                className="input"
                value={formData.emergencyContact.phone}
                onChange={handleEmergencyChange}
                placeholder="Emergency phone number"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/patients')}
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
                Registering...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Register Patient
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
