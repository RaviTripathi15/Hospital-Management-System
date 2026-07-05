import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import authService from '@/services/authService'
import { z } from 'zod'
import { Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function ResetPassword() {
  const { t } = useTranslation()
  const { token } = useParams()
  const navigate = useNavigate()
  const storeLogin = useAuthStore((state) => state.login)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await authService.resetPassword(token, data.password)
      const responseData = response.data || response
      
      const { user, accessToken, refreshToken } = responseData
      storeLogin(user, accessToken, refreshToken)

      toast.success(t('auth.passwordResetSuccess'))
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.message || t('errors.invalidToken')
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('auth.resetPassword')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Set a secure new password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password */}
        <div>
          <label className="label" htmlFor="password">
            {t('auth.newPassword')}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Lock className="w-5 h-5" />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder')}
              className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
              <Lock className="w-5 h-5" />
            </span>
            <input
              id="confirmPassword"
              type="password"
              placeholder={t('auth.confirmPassword')}
              className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Action Button */}
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
            t('auth.resetPassword')
          )}
        </button>
      </form>

      {/* Back to Login */}
      <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-700">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('auth.backToLogin')}
        </Link>
      </div>
    </div>
  )
}
