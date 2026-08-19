import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    /**
     * In dev the app calls /api/... on its own origin and Vite forwards it to
     * the real API. Server-to-server, so the browser never runs a CORS check.
     * Production still calls the API directly and does need CORS headers there.
     */
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'https://api.kribblecare.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
