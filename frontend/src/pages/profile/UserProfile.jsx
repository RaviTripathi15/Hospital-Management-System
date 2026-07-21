import React, { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import authService from '@/services/authService'
import roleRequestService from '@/services/roleRequestService'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { changePasswordSchema } from '@/utils/validators'
import { User, Phone, MapPin, Key, Upload, Shield, Eye, EyeOff, Loader2, Calendar, Building, LogIn, ArrowLeftRight, CheckCircle2, XCircle, AlertCircle, Check, Settings, Moon, Sun, Globe, Laptop, Smartphone, Lock, Link2, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import RoleSwitchModal from '@/components/common/RoleSwitchModal'
import { AnimatePresence } from 'framer-motion'

export default function UserProfile() {
  const { t } = useTranslation()
  const { user, updateUser, refreshUser } = useAuth()
  const permissions = usePermissions()
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'security', 'role'
  const [latestRequest, setLatestRequest] = useState(null)
  const [isRequestLoading, setIsRequestLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isLoadingPassword, setIsLoadingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [previewPic, setPreviewPic] = useState(user?.profilePic || null)
  const [selectedFile, setSelectedFile] = useState(null)
  
  const fileInputRef = useRef(null)

  const { theme, toggleTheme } = useUIStore()

  // Notification Preferences State (persisted locally)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    const saved = localStorage.getItem(`notif_prefs_${user?.email || 'guest'}`)
    return saved ? JSON.parse(saved) : { email: true, sms: true, push: true, digest: false }
  })

  // Privacy Settings State (persisted locally)
  const [privacyPrefs, setPrivacyPrefs] = useState(() => {
    const saved = localStorage.getItem(`privacy_prefs_${user?.email || 'guest'}`)
    return saved ? JSON.parse(saved) : { publicProfile: false, researchShare: false, insuranceSync: false, tfa: false }
  })

  // Connected Devices State (persisted locally)
  const [connectedDevices, setConnectedDevices] = useState(() => {
    const saved = localStorage.getItem(`connected_devices_${user?.email || 'guest'}`)
    return saved ? JSON.parse(saved) : [
      { id: 'dev-1', name: 'Apple Watch Series 9', type: 'Smartwatch', status: 'Connected', lastSync: '5 mins ago' },
      { id: 'dev-2', name: 'Omron BP7000 Smart Meter', type: 'Blood Pressure Monitor', status: 'Connected', lastSync: '1 hour ago' },
      { id: 'dev-3', name: 'FreeStyle Libre Glucose Sensor', type: 'CGM Sensor', status: 'Disconnected', lastSync: '1 day ago' }
    ]
  })

  const updateNotifPrefs = (key) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifPrefs(updated)
    localStorage.setItem(`notif_prefs_${user?.email || 'guest'}`, JSON.stringify(updated))
  }

  const updatePrivacyPrefs = (key) => {
    const updated = { ...privacyPrefs, [key]: !privacyPrefs[key] }
    setPrivacyPrefs(updated)
    localStorage.setItem(`privacy_prefs_${user?.email || 'guest'}`, JSON.stringify(updated))
  }

  const handleDeviceAction = (id, action) => {
    if (action === 'toggle') {
      const updated = connectedDevices.map(d => d.id === id ? {
        ...d,
        status: d.status === 'Connected' ? 'Disconnected' : 'Connected',
        lastSync: 'Just now'
      } : d)
      setConnectedDevices(updated)
      localStorage.setItem(`connected_devices_${user?.email || 'guest'}`, JSON.stringify(updated))
      toast.success('Device status updated successfully')
    } else if (action === 'sync') {
      const updated = connectedDevices.map(d => d.id === id ? { ...d, lastSync: 'Just now' } : d)
      setConnectedDevices(updated)
      localStorage.setItem(`connected_devices_${user?.email || 'guest'}`, JSON.stringify(updated))
      toast.success('Sync complete')
    }
  }

  const handlePairNewDevice = () => {
    const name = window.prompt('Enter Device Name (e.g. Fitbit Charge 6, Dexcom G7):')
    if (!name) return
    const type = window.prompt('Enter Device Type (e.g. Activity Tracker, CGM):') || 'Health Tracker'
    const newDevice = {
      id: `dev-${Date.now()}`,
      name,
      type,
      status: 'Connected',
      lastSync: 'Just now'
    }
    const updated = [...connectedDevices, newDevice]
    setConnectedDevices(updated)
    localStorage.setItem(`connected_devices_${user?.email || 'guest'}`, JSON.stringify(updated))
    toast.success('New medical device paired successfully')
  }

  const fetchLatestRequest = async () => {
    setIsRequestLoading(true)
    try {
      const res = await roleRequestService.getMyRequest()
      setLatestRequest(res.data || res)
    } catch (err) {
      console.error('Error fetching role request:', err)
    } finally {
      setIsRequestLoading(false)
    }
  }

  useEffect(() => {
    fetchLatestRequest()
  }, [])

  const handleRoleSuccess = async (updatedUser, accessToken, refreshToken) => {
    if (updatedUser && accessToken && refreshToken) {
      updateUser(updatedUser)
      const { login: storeLogin } = useAuthStore.getState()
      storeLogin(updatedUser, accessToken, refreshToken)
    }
    await fetchLatestRequest()
  }

  // Profile Form Hook
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      gender: user?.gender || '',
      district: user?.district || '',
    },
  })

  // Password Form Hook
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('errors.fileTooLarge') || 'File size exceeds 5MB limit')
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewPic(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const onUpdateProfile = async (data) => {
    setIsLoadingProfile(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name.trim())
      formData.append('phone', data.phone.trim())
      formData.append('gender', data.gender)
      formData.append('district', data.district.trim())

      if (selectedFile) {
        formData.append('profilePic', selectedFile)
      }

      // API call to update profile
      const response = await authService.updateProfile(formData)
      const responseData = response.data || response
      updateUser(responseData)
      await refreshUser()
      toast.success(t('profile.profileUpdated'))
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.message || t('common.error')
      toast.error(errorMsg)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const onChangePassword = async (data) => {
    setIsLoadingPassword(true)
    try {
      await authService.changePassword(data.currentPassword, data.newPassword)
      toast.success(t('profile.passwordChanged'))
      resetPasswordForm()
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.message || t('common.error')
      toast.error(errorMsg)
    } finally {
      setIsLoadingPassword(false)
    }
  }

  const formattedDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formattedDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-elevated p-6 text-white flex flex-col md:flex-row items-center gap-6">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-24 h-24 rounded-2xl bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center relative">
            {previewPic ? (
              <img
                src={previewPic.startsWith('data:') ? previewPic : `${import.meta.env.VITE_SOCKET_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin)}${previewPic}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-white" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        <div className="text-center md:text-left space-y-1 flex-1">
          <h1 className="text-2xl font-bold">{user?.name}</h1>
          <p className="text-primary-100 font-medium text-sm flex items-center justify-center md:justify-start gap-1">
            <span className="badge bg-white/20 text-white uppercase text-[10px]">
              {t(`roles.${user?.role}`)}
            </span>
            {user?.healthCenter && (
              <>
                <span className="opacity-50">•</span>
                <span className="flex items-center gap-0.5 text-xs text-primary-50">
                  <Building className="w-3.5 h-3.5" />
                  {user.healthCenter.name}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#1e2d4a] flex-wrap">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 font-extrabold'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <User className="w-4 h-4" />
          {t('profile.personalInfo')}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'security'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 font-extrabold'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <Shield className="w-4 h-4" />
          {t('profile.changePassword')}
        </button>
        <button
          onClick={() => setActiveTab('role')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'role'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 font-extrabold'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Role & Permissions
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'settings'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 font-extrabold'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings Preferences
        </button>
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main forms Panel (Left/Center) */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === 'role' ? (
            <div className="card p-6 space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Role & Permissions</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage permissions and request role changes</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn btn-primary flex items-center gap-2 py-2 px-4 text-xs font-bold"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Switch Role
                </button>
              </div>

              {/* Status banner */}
              {latestRequest && latestRequest.status === 'pending' && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl flex gap-3 text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div className="text-xs space-y-0.5 leading-normal">
                    <p className="font-bold">Pending Request</p>
                    <p>Your request to switch to <strong className="capitalize">{latestRequest.requestedRole.replace('_', ' ')}</strong> is pending review.</p>
                    <p className="text-[10px] opacity-75 mt-1">Submitted on: {formattedDateTime(latestRequest.createdAt)}</p>
                  </div>
                </div>
              )}

              {latestRequest && latestRequest.status === 'rejected' && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-2xl flex gap-3 text-red-800 dark:text-red-300">
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                  <div className="text-xs space-y-0.5 leading-normal">
                    <p className="font-bold">Request Rejected</p>
                    <p>Your request to switch to <strong className="capitalize">{latestRequest.requestedRole.replace('_', ' ')}</strong> was rejected.</p>
                    <p className="italic mt-1">Reason: "{latestRequest.adminFeedback}"</p>
                  </div>
                </div>
              )}

              {latestRequest && latestRequest.status === 'approved' && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-900/30 rounded-2xl flex gap-3 text-green-800 dark:text-green-300">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <div className="text-xs space-y-0.5 leading-normal">
                    <p className="font-bold">Request Approved</p>
                    <p>Your transition to <strong className="capitalize">{latestRequest.requestedRole.replace('_', ' ')}</strong> was approved.</p>
                  </div>
                </div>
              )}

              {/* Current Permissions Check list */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Your Current System Privileges</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { key: 'canBookAppointment', label: 'Book Appointments' },
                    { key: 'canManagePatients', label: 'Manage Patient Records' },
                    { key: 'canManageInventory', label: 'Manage Medical Inventory' },
                    { key: 'canViewReports', label: 'View Medical & Analytical Reports' },
                    { key: 'canCreateReports', label: 'Create Facility Reports' },
                    { key: 'canApproveReports', label: 'Approve System Reports' },
                    { key: 'canViewAI', label: 'Access AI Forecasts & Insights' },
                    { key: 'canManageCenter', label: 'Manage Health Center Facilities' },
                    { key: 'canManageUsers', label: 'Manage Platform Users' },
                    { key: 'canSystemSettings', label: 'Access Global System Settings' }
                  ].map((perm) => (
                    <div
                      key={perm.key}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                        permissions[perm.key]
                          ? 'border-green-200 bg-green-50/15 dark:bg-green-950/5 text-gray-800 dark:text-gray-200'
                          : 'border-gray-100 dark:border-gray-800/80 bg-gray-50/20 dark:bg-gray-800/10 text-gray-400 opacity-60'
                      }`}
                    >
                      <div className={`p-1 rounded-full ${permissions[perm.key] ? 'bg-green-100 dark:bg-green-950/40 text-green-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold">{perm.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'profile' ? (
            <div className="card p-6 space-y-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('profile.editProfile')}
              </h2>
              <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="label" htmlFor="name">
                    {t('auth.fullName')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="name"
                      type="text"
                      className={`input-field pl-9 ${profileErrors.name ? 'border-red-500' : ''}`}
                      {...registerProfile('name', { required: true })}
                    />
                  </div>
                  {profileErrors.name && (
                    <p className="text-xs text-red-500 mt-1">{t('common.required')}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="label" htmlFor="phone">
                    {t('common.phone')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      id="phone"
                      type="text"
                      className={`input-field pl-9 ${profileErrors.phone ? 'border-red-500' : ''}`}
                      {...registerProfile('phone')}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="label" htmlFor="gender">
                    {t('patients.gender')}
                  </label>
                  <select
                    id="gender"
                    className="input-field"
                    {...registerProfile('gender')}
                  >
                    <option value="">{t('common.selectOption')}</option>
                    <option value="male">{t('patients.male')}</option>
                    <option value="female">{t('patients.female')}</option>
                    <option value="other">{t('patients.other')}</option>
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="label" htmlFor="district">
                    {t('admin.district')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      id="district"
                      type="text"
                      className={`input-field pl-9 ${profileErrors.district ? 'border-red-500' : ''}`}
                      {...registerProfile('district')}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoadingProfile}
                    className="btn-primary flex items-center gap-2 px-6"
                  >
                    {isLoadingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('profile.saveChanges')
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : activeTab === 'settings' ? (
            <div className="card p-6 space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Settings & Preferences</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Customize display languages, security privacy logs, and pair health sensors.</p>
              </div>

              {/* Theme & Language Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-200/40 dark:border-gray-700/50 pb-5">
                <div className="p-4 bg-gray-50/50 dark:bg-gray-800/10 border border-gray-200/50 dark:border-gray-800/40 rounded-2xl space-y-3.5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Interface Theme</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">Toggle interface aesthetics between light and dark modes.</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    type="button"
                    className="w-full py-2 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-700 dark:text-gray-200 font-extrabold rounded-xl text-xs border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="w-4.5 h-4.5 text-amber-500 animate-spin-slow" />
                        <span>Switch to Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-4.5 h-4.5 text-indigo-500" />
                        <span>Switch to Dark Mode</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-gray-800/10 border border-gray-200/50 dark:border-gray-800/40 rounded-2xl space-y-3.5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Language Selection</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">Choose preferred localization for diagnostic cards & reports.</p>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Globe className="w-4.5 h-4.5" />
                    </span>
                    <select
                      value={i18n.language || 'en'}
                      onChange={(e) => i18n.changeLanguage(e.target.value)}
                      className="w-full input-field pl-9 pr-4 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="en">English (default)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="mr">मराठी (Marathi)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="border-b border-gray-200/40 dark:border-gray-700/50 pb-5 space-y-3.5">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Notification Channels</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">Configure priority routes for vital reminders and campaigns.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { key: 'email', label: 'Email Alerts', desc: 'Prescription refills & booking receipts' },
                    { key: 'sms', label: 'SMS Reminders', desc: 'Critical vitals alerts & medicine schedules' },
                    { key: 'push', label: 'Push Notifications', desc: 'Immediate emergency console responses' },
                    { key: 'digest', label: 'Weekly Summary Digest', desc: 'Monthly health metrics trends analytical reports' }
                  ].map(item => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-3.5 bg-gray-50/20 dark:bg-gray-800/5 border border-gray-200/40 dark:border-gray-800/25 rounded-2xl cursor-pointer select-none hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-extrabold text-gray-900 dark:text-white block">{item.label}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-0.5">{item.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifPrefs[item.key]}
                        onChange={() => updateNotifPrefs(item.key)}
                        className="w-4.5 h-4.5 accent-primary-600 rounded shrink-0 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="border-b border-gray-200/40 dark:border-gray-700/50 pb-5 space-y-3.5">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Data Privacy & Security</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">Control access scopes of your personal medical history records.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { key: 'publicProfile', label: 'Public Profile Discovery', desc: 'Allow doctors to look up profile by name query' },
                    { key: 'researchShare', label: 'Medical Research Program', desc: 'Share anonymous vitals with local epidemiological studies' },
                    { key: 'insuranceSync', label: 'Insurance Data Share', desc: 'Sync health scores with empaneled insurance systems' },
                    { key: 'tfa', label: 'Two-Factor Authentication (2FA)', desc: 'Request OTP verify token on every health portal login' }
                  ].map(item => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-3.5 bg-gray-50/20 dark:bg-gray-800/5 border border-gray-200/40 dark:border-gray-800/25 rounded-2xl cursor-pointer select-none hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-extrabold text-gray-900 dark:text-white block">{item.label}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-0.5">{item.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacyPrefs[item.key]}
                        onChange={() => updatePrivacyPrefs(item.key)}
                        className="w-4.5 h-4.5 accent-indigo-600 rounded shrink-0 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Connected Devices */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Connected Health Devices</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">Pair wearable activity meters or BP monitors to sync vitals logs.</p>
                  </div>
                  <button
                    onClick={handlePairNewDevice}
                    type="button"
                    className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/10 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                  >
                    Pair Device
                  </button>
                </div>

                <div className="space-y-3">
                  {connectedDevices.map(dev => (
                    <div
                      key={dev.id}
                      className="p-4 bg-gray-50/20 dark:bg-gray-800/5 border border-gray-200/45 dark:border-gray-800/25 rounded-2xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 shrink-0">
                          {dev.type === 'Smartwatch' ? <Smartphone className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold text-gray-900 dark:text-white block">{dev.name}</span>
                          <span className="text-[9px] text-gray-400 dark:text-gray-400 block mt-0.5">{dev.type} • Sync: {dev.lastSync}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "badge text-[8px] font-black px-2 py-0.5 rounded-full uppercase leading-none border shrink-0",
                          dev.status === 'Connected'
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100/30 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-800 dark:text-gray-500"
                        )}>
                          {dev.status}
                        </span>
                        
                        <button
                          onClick={() => handleDeviceAction(dev.id, 'sync')}
                          disabled={dev.status !== 'Connected'}
                          type="button"
                          className="py-1 px-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-lg text-[9px] uppercase tracking-wider transition-colors border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                        >
                          Sync
                        </button>
                        
                        <button
                          onClick={() => handleDeviceAction(dev.id, 'toggle')}
                          type="button"
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer active:scale-95"
                          title={dev.status === 'Connected' ? 'Disconnect' : 'Connect'}
                        >
                          <Link2 className="w-4 h-4 rotate-45" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-6 space-y-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('profile.changePassword')}
              </h2>
              <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="label" htmlFor="currentPassword">
                    {t('auth.currentPassword')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Key className="w-4 h-4" />
                    </span>
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      className={`input-field pl-9 pr-9 ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                      {...registerPassword('currentPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="label" htmlFor="newPassword">
                    {t('auth.newPassword')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Key className="w-4 h-4" />
                    </span>
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      className={`input-field pl-9 pr-9 ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                      {...registerPassword('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="label" htmlFor="confirmPassword">
                    {t('auth.confirmPassword')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Key className="w-4 h-4" />
                    </span>
                    <input
                      id="confirmPassword"
                      type="password"
                      className={`input-field pl-9 ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                      {...registerPassword('confirmPassword')}
                    />
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoadingPassword}
                    className="btn-primary flex items-center gap-2 px-6"
                  >
                    {isLoadingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('profile.changePassword')
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Side Stats Panel (Right) */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('profile.accountInfo')}
            </h3>

            {/* Email */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400">{t('common.email')}</span>
              <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{user?.email}</p>
            </div>

            {/* Joined Date */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {t('profile.joinedDate')}
              </span>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formattedDate(user?.createdAt)}
              </p>
            </div>

            {/* Last Login */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                <LogIn className="w-3.5 h-3.5" />
                {t('profile.lastLogin')}
              </span>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formattedDateTime(user?.lastLogin)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <RoleSwitchModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleRoleSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
