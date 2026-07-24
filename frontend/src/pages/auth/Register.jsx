import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import authService from '@/services/authService'
import { registerSchema } from '@/utils/validators'
import { Eye, EyeOff, User, Mail, Lock, Key, Phone, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ROLES } from '@/utils/constants'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const storeLogin = useAuthStore((state) => state.login)
  const { googleLogin } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isStaff, setIsStaff] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: ROLES.CITIZEN,
      centerCode: '',
    },
  })

  useEffect(() => {
    /* global google */
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com',
        callback: async (response) => {
          setIsLoading(true)
          try {
            await googleLogin(response.credential)
            navigate('/dashboard')
          } catch (err) {
            console.error(err)
            const errorMsg = err.response?.data?.message || 'Google authentication failed'
            toast.error(errorMsg)
          } finally {
            setIsLoading(false)
          }
        },
      })

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        {
          theme: 'outline',
          size: 'large',
          width: '350',
          text: 'continue_with',
          shape: 'rectangular',
        }
      )
    }
  }, [googleLogin, navigate])

  const handleRoleToggle = (checked) => {
    setIsStaff(checked)
    setValue('role', checked ? ROLES.STAFF : ROLES.CITIZEN)
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const payload = {
        name: `${data.firstName.trim()} ${data.lastName.trim()}`,
        email: data.email.trim(),
        password: data.password,
        role: data.role || ROLES.CITIZEN,
        // centerCode can be used by the backend to map user to their health center
        centerCode: data.centerCode || undefined,
      }

      const response = await authService.register(payload)
      const responseData = response.data || response
      
      const { user, accessToken, refreshToken } = responseData
      storeLogin(user, accessToken, refreshToken)
      
      toast.success(t('common.createSuccess'))
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.message || t('common.error')
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('auth.register')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create your personalized health account
        </p>
      </div>

      <div className="space-y-4">
        <div id="google-signin-btn" className="w-full flex justify-center"></div>
        
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase tracking-wider font-semibold">
            OR
          </span>
          <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="firstName">
              {t('auth.firstName')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </span>
              <input
                id="firstName"
                type="text"
                className={`input-field pl-9 ${errors.firstName ? 'border-red-500' : ''}`}
                {...register('firstName')}
              />
            </div>
            {errors.firstName && (
              <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="lastName">
              {t('auth.lastName')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </span>
              <input
                id="lastName"
                type="text"
                className={`input-field pl-9 ${errors.lastName ? 'border-red-500' : ''}`}
                {...register('lastName')}
              />
            </div>
            {errors.lastName && (
              <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="label" htmlFor="email">
            {t('auth.email')}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              id="email"
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              className={`input-field pl-9 ${errors.email ? 'border-red-500' : ''}`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Toggle Staff Role */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Registering as Health Center Staff?
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isStaff}
              onChange={(e) => handleRoleToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {/* Conditional Role and Center Code Details */}
        {isStaff && (
          <div className="space-y-4 p-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl animate-fade-in">
            {/* Specific Staff Role Selection */}
            <div>
              <label className="label" htmlFor="role">
                Select Staff Role
              </label>
              <select
                id="role"
                className="input-field"
                {...register('role')}
              >
                <option value={ROLES.STAFF}>{t('roles.staff')}</option>
                <option value={ROLES.DOCTOR}>{t('roles.doctor')}</option>
                <option value={ROLES.NURSE}>{t('roles.nurse')}</option>
              </select>
            </div>

            {/* Center Code */}
            <div>
              <label className="label" htmlFor="centerCode">
                {t('auth.centerCode')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  id="centerCode"
                  type="text"
                  placeholder={t('auth.enterCenterCode')}
                  className="input-field pl-9"
                  {...register('centerCode')}
                />
              </div>
              {errors.centerCode && (
                <p className="text-xs text-red-500 mt-1">{errors.centerCode.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Password Fields */}
        <div>
          <label className="label" htmlFor="password">
            {t('auth.password')}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder')}
              className={`input-field pl-9 pr-9 ${errors.password ? 'border-red-500' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="label" htmlFor="confirmPassword">
            {t('auth.confirmPassword')}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              id="confirmPassword"
              type="password"
              placeholder={t('auth.confirmPassword')}
              className={`input-field pl-9 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Register Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-sm mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('common.loading')}
            </>
          ) : (
            t('auth.register')
          )}
        </button>
      </form>

      {/* Link to Signin */}
      <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-700 text-sm">
        <span className="text-gray-500 dark:text-gray-400 mr-1">
          {t('auth.alreadyHaveAccount')}
        </span>
        <Link
          to="/login"
          className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {t('auth.signIn')}
        </Link>
      </div>
    </div>
  )
}
