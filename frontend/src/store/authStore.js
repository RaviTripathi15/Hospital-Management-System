import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      rememberMe: false,

      login: (user, token, refreshToken, rememberMe = false) => {
        set({ user, token, refreshToken, isAuthenticated: true, rememberMe })
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, rememberMe: false })
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
      storage: {
        getItem: (name) => {
          return localStorage.getItem(name) || sessionStorage.getItem(name)
        },
        setItem: (name, value) => {
          try {
            const parsed = JSON.parse(value)
            const remember = parsed.state?.rememberMe
            if (remember) {
              localStorage.setItem(name, value)
              sessionStorage.removeItem(name)
            } else {
              sessionStorage.setItem(name, value)
              localStorage.removeItem(name)
            }
          } catch (e) {
            localStorage.setItem(name, value)
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
          sessionStorage.removeItem(name)
        }
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
      }),
    }
  )
)
