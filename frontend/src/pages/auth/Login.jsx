import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { loginSchema } from '@/utils/validators'
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: localStorage.getItem('remember_email') || '',
      password: '',
    },
  })

  const [rememberMe, setRememberMe] = useState(
    !!localStorage.getItem('remember_email')
  )

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      if (rememberMe) {
        localStorage.setItem('remember_email', data.email)
      } else {
        localStorage.removeItem('remember_email')
      }
      await login(data.email, data.password, rememberMe)
      navigate(from, { replace: true })
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.message || t('auth.invalidCredentials')
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('auth.signIn')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Access your secure healthcare workspace
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="label" htmlFor="email">
            {t('auth.email')}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Mail className="w-5 h-5" />
            </span>
            <input
              id="email"
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              className={`input-field pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="label mb-0" htmlFor="password">
              {t('auth.password')}
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {t('auth.forgotPasswordLink')}
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Lock className="w-5 h-5" />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder')}
              className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
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

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <label className="flex items-center text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2 cursor-pointer dark:bg-gray-700 dark:border-gray-600"
            />
            {t('auth.rememberMe')}
          </label>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('common.loading')}
            </>
          ) : (
            t('auth.signIn')
          )}
        </button>
      </form>

      {/* Link to Signup */}
      <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-700 text-sm">
        <span className="text-gray-500 dark:text-gray-400 mr-1">
          {t('auth.dontHaveAccount')}
        </span>
        <Link
          to="/register"
          className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {t('auth.signUp')}
        </Link>
      </div>
    </div>
  )
}
