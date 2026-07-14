import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

// ─── Base URL resolution ──────────────────────────────────────────────────────
//
// Priority:
//  1. VITE_API_URL env var  (set in Render Dashboard for production)
//  2. Same-origin relative path  /api/v1  (works when frontend is served from
//     the same domain OR when Vite dev proxy is active)
//
// In LOCAL DEV:
//   VITE_API_URL=http://localhost:5000/api/v1
//   The Vite proxy in vite.config.js forwards /api → backend, but using the
//   absolute URL directly is simpler and avoids proxy latency.
//
// In PRODUCTION (Render):
//   Set VITE_API_URL=https://<backend>.onrender.com/api/v1 in the Render
//   frontend service's Environment Variables panel.
//   The CORS whitelist on the backend must include the frontend URL too
//   (set CLIENT_URL on the backend service).
//
const BASE_URL = import.meta.env.VITE_API_URL?.trim() || '/api/v1'

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,   // 30 s — long enough for AI / analytics endpoints
  withCredentials: true,  // send cookies (refresh-token httpOnly cookie)
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request interceptor — attach JWT access token ───────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response interceptor — handle 401 → token refresh ───────────────────────
let isRefreshing = false
let failedQueue = []           // requests that arrived while refresh is in flight

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  // Pass successful responses straight through
  (response) => response,

  async (error) => {
    const originalRequest = error.config

    // ── Token expired / missing ────────────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If a refresh is already in-flight, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = useAuthStore.getState().getRefreshToken()

      if (!refreshToken) {
        // No refresh token → force logout
        useAuthStore.getState().logout()
        window.location.href = '/login'
        isRefreshing = false
        return Promise.reject(error)
      }

      try {
        // Call the refresh endpoint directly — not via the `api` instance
        // (to avoid triggering this interceptor recursively)
        const refreshResponse = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          { refreshToken },
          { withCredentials: true }
        )
        const { token: newToken } =
          refreshResponse.data?.data || refreshResponse.data

        useAuthStore.getState().setToken(newToken)
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // ── Other HTTP errors ──────────────────────────────────────────────────
    if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission to do that.')
      let allowedRoles = []
      const msg = error.response?.data?.message || ''
      if (msg.includes('Required role(s):')) {
        const rolesPart = msg.split('Required role(s):')[1] || ''
        allowedRoles = rolesPart.split(',').map(r => r.trim().replace(/\.$/, ''))
      } else if (msg.includes('Minimum required role:')) {
        const minRole = (msg.split('Minimum required role:')[1] || '').trim().replace(/\.$/, '')
        const ROLES_LIST = ['citizen', 'staff', 'doctor', 'nurse', 'phc_admin', 'chc_admin', 'district_admin', 'super_admin']
        const minIdx = ROLES_LIST.indexOf(minRole)
        if (minIdx !== -1) {
          allowedRoles = ROLES_LIST.slice(minIdx)
        }
      }
      setTimeout(() => {
        window.location.href = `/unauthorized?allowedRoles=${encodeURIComponent(JSON.stringify(allowedRoles))}`
      }, 1000)
    } else if (error.response?.status === 404) {
      // 404s are handled per-component; do not show a global toast
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please slow down and try again shortly.')
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else if (!error.response) {
      // Network error (no response at all — CORS pre-flight failure, offline, etc.)
      toast.error('Network error. Please check your connection or try again.')
    }

    return Promise.reject(error)
  }
)

export default api
