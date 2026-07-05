import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import authService from '@/services/authService'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await authService.forgotPassword(data.email)
      setSubmittedEmail(data.email)
      setIsSubmitted(true)
      toast.success(t('auth.resetLinkSent'))
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.message || t('common.error')
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full mb-2">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('auth.resetLinkSent')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-balance leading-relaxed">
            We have sent a password reset link to <strong>{submittedEmail}</strong>. Please check your inbox and spam folders.
          </p>
        </div>

        <div className="pt-4">
          <Link
            to="/login"
            className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('auth.forgotPassword')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-balance leading-relaxed">
          Enter your registered email address and we'll send you a link to reset your password.
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
              className={`input-field pl-10 ${errors.email ? 'border-red-500' : ''}`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
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
            t('auth.sendResetLink')
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
