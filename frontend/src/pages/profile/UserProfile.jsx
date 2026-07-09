import React, { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import authService from '@/services/authService'
import { changePasswordSchema } from '@/utils/validators'
import { User, Phone, MapPin, Key, Upload, Shield, Eye, EyeOff, Loader2, Calendar, Building, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UserProfile() {
  const { t } = useTranslation()
  const { user, updateUser, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile') // 'profile' or 'security'
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isLoadingPassword, setIsLoadingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [previewPic, setPreviewPic] = useState(user?.profilePic || null)
  const [selectedFile, setSelectedFile] = useState(null)
  
  const fileInputRef = useRef(null)

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
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <User className="w-4 h-4" />
          {t('profile.personalInfo')}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          {t('profile.changePassword')}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main forms Panel (Left/Center) */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === 'profile' ? (
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
    </div>
  )
}
