import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables for the current mode (development / production)
  const env = loadEnv(mode, process.cwd(), '')

  // The backend origin used for the dev-server proxy.
  // Falls back to localhost:5000 when VITE_API_URL is not set.
  const backendOrigin = env.VITE_API_URL
    ? new URL(env.VITE_API_URL).origin        // strip /api/v1 path → just the host
    : 'http://localhost:5000'

  return {
    plugins: [react()],

    resolve: {
      alias: {
        // Allows `import X from '@/components/...'` anywhere in src/
        '@': path.resolve(__dirname, './src'),
      },
    },

    // ─── Dev server ──────────────────────────────────────────────────────────
    server: {
      port: 3000,
      // Proxy /api and /socket.io requests to the backend during local dev.
      // This avoids CORS issues completely in development because the browser
      // sees all traffic as same-origin (localhost:3000).
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
          secure: false,      // allow self-signed certs in dev if needed
        },
        '/socket.io': {
          target: backendOrigin,
          changeOrigin: true,
          ws: true,           // proxy WebSocket upgrade requests
        },
      },
    },

    // ─── Production build ────────────────────────────────────────────────────
    build: {
      // Raise the bundle-size warning threshold (recharts + leaflet are large)
      chunkSizeWarningLimit: 1500,

      rollupOptions: {
        output: {
          // Split vendor code into separate chunks for better caching
          manualChunks: (id) => {
            if (id.includes('node_modules/react') ||
                id.includes('node_modules/react-dom') ||
                id.includes('node_modules/react-router-dom') ||
                id.includes('node_modules/scheduler')) {
              return 'vendor-react'
            }
            if (id.includes('node_modules/recharts') ||
                id.includes('node_modules/d3-') ||
                id.includes('node_modules/victory-vendor')) {
              return 'vendor-charts'
            }
            if (id.includes('node_modules/leaflet') ||
                id.includes('node_modules/react-leaflet') ||
                id.includes('node_modules/@react-leaflet')) {
              return 'vendor-maps'
            }
            if (id.includes('node_modules/@tanstack')) {
              return 'vendor-query'
            }
            if (id.includes('node_modules/i18next') ||
                id.includes('node_modules/react-i18next')) {
              return 'vendor-i18n'
            }
            if (id.includes('node_modules/zustand')) {
              return 'vendor-zustand'
            }
            if (id.includes('node_modules/socket.io-client') ||
                id.includes('node_modules/engine.io-client')) {
              return 'vendor-socket'
            }
          },
        },
      },
    },
  }
})
