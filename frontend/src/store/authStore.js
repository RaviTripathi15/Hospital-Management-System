import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, token, refreshToken) => {
        set({ user, token, refreshToken, isAuthenticated: true })
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
        localStorage.removeItem('auth-storage')
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }))
      },

      setToken: (token) => {
        set({ token })
      },

      setRefreshToken: (refreshToken) => {
        set({ refreshToken })
      },

      getToken: () => get().token,
      getRefreshToken: () => get().refreshToken,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
