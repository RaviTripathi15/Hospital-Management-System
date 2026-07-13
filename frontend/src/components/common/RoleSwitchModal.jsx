import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ROLES } from '@/utils/constants'
import roleRequestService from '@/services/roleRequestService'
import toast from 'react-hot-toast'

export default function RoleSwitchModal({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation()
  const [selectedRole, setSelectedRole] = useState(ROLES.CITIZEN)
  const [employeeId, setEmployeeId] = useState('')
  const [hospitalCode, setHospitalCode] = useState('')
  const [file, setFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  if (!isOpen) return null

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
      }
    }
  }

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image or PDF/Word document.')
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (selectedRole !== ROLES.CITIZEN) {
      if (!employeeId.trim()) {
        toast.error('Employee ID is required.')
        return
      }
      if (!hospitalCode.trim()) {
        toast.error('Hospital/Center Code is required.')
        return
      }
      if (!file) {
        toast.error('Verification document is required.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('requestedRole', selectedRole)
      if (selectedRole !== ROLES.CITIZEN) {
        formData.append('employeeId', employeeId.trim())
        formData.append('hospitalCode', hospitalCode.trim())
        formData.append('verificationDoc', file)
      }

      const response = await roleRequestService.createRequest(formData)
      const data = response.data || response

      if (data.autoApproved) {
        toast.success('Your role has been switched to Citizen immediately.')
        if (onSuccess) onSuccess(data.user, data.accessToken, data.refreshToken)
      } else {
        toast.success('Role switch request submitted. Awaiting administrator approval.')
        if (onSuccess) onSuccess()
      }
      onClose()
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.message || 'Failed to submit role request.'
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Available options for selection (Excluding super_admin since it cannot be self-requested)
  const roleOptions = [
    { value: ROLES.CITIZEN, label: 'Citizen', desc: 'Basic patient access to view history and book appointments.' },
    { value: ROLES.STAFF, label: 'Hospital Staff', desc: 'Manage inventory, patient records, and check attendance.' },
    { value: ROLES.DOCTOR, label: 'Doctor', desc: 'Provide medical consults, write prescriptions, and check patient logs.' },
    { value: ROLES.PHC_ADMIN, label: 'PHC Admin', desc: 'Primary Health Center administrative access & reports.' },
    { value: ROLES.CHC_ADMIN, label: 'CHC Admin', desc: 'Community Health Center administrative access & reports.' },
    { value: ROLES.DISTRICT_ADMIN, label: 'District Admin', desc: 'Manage district centers, outbreak reporting, and approvals.' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Request Role Switch</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upgrade or transition your platform access permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-750 dark:text-gray-300">Select Requested Role</label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                    selectedRole === role.value
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 shadow-sm ring-1 ring-primary-500'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                >
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{role.label}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 leading-normal leading-relaxed">{role.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedRole !== ROLES.CITIZEN ? (
              <motion.div
                key="verification-inputs"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 pt-2 overflow-hidden"
              >
                {/* Employee ID */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="employeeId" className="label text-xs">Employee ID</label>
                    <input
                      type="text"
                      id="employeeId"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="e.g. EMP-90812"
                      className="input w-full text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="hospitalCode" className="label text-xs">Hospital / Center Code</label>
                    <input
                      type="text"
                      id="hospitalCode"
                      value={hospitalCode}
                      onChange={(e) => setHospitalCode(e.target.value)}
                      placeholder="e.g. HC-PATNA-01"
                      className="input w-full text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Upload Verification Document */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Upload Verification Document</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      dragActive
                        ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/10'
                        : file
                        ? 'border-green-400 bg-green-50/10 dark:bg-green-950/5'
                        : 'border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-700'
                    }`}
                  >
                    <input
                      type="file"
                      id="verificationDoc"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    />
                    
                    {file ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 bg-green-50 dark:bg-green-950/40 text-green-500 rounded-full">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-xs">{file.name}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setFile(null)
                          }}
                          className="text-xs text-red-500 hover:underline relative z-20"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 bg-gray-50 dark:bg-gray-750 text-gray-450 rounded-full">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Drag & drop or click to upload
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            PDF, Word, or Image files up to 5MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="citizen-warning"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl flex gap-3 text-amber-800 dark:text-amber-300 mt-2"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="text-xs space-y-1 leading-normal leading-relaxed">
                  <p className="font-bold">No Verification Required</p>
                  <p>Switching to Citizen role takes effect immediately. You will lose access to medical dashboards and hospital inventories, and will be redirected to the Citizen view.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn bg-gray-100 dark:bg-gray-700 text-gray-750 dark:text-gray-200 hover:bg-gray-250 dark:hover:bg-gray-650 flex-1 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex-1 py-3 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : selectedRole === ROLES.CITIZEN ? (
                'Switch Instantly'
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
