import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import authService from '@/services/authService'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export function useAuth() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, token, isAuthenticated, login: storeLogin, logout: storeLogout, updateUser } = useAuthStore()

  const login = useCallback(
    async (email, password) => {
      const data = await authService.login(email, password)
      const { user: userData, accessToken, refreshToken } = data.data || data
      storeLogin(userData, accessToken, refreshToken)
      toast.success(t('auth.loginSuccess'))
      return userData
    },
    [storeLogin, t]
  )

  const logout = useCallback(async () => {
    await authService.logout()
    storeLogout()
    toast.success(t('auth.logoutSuccess'))
    navigate('/login')
  }, [storeLogout, navigate, t])

  const refreshUser = useCallback(async () => {
    try {
      const data = await authService.getMe()
      const userData = data.data || data
      updateUser(userData)
      return userData
    } catch {
      // silently fail
    }
  }, [updateUser])

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    updateUser,
    refreshUser,
  }
}
