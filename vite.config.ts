import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/',
  server: {
    host: true,
    proxy: {
      // All /api/* requests are proxied to our Express backend (port 3001).
      // The Express backend holds the Incorta PAT server-side — never exposed to the browser.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: false,
      },
    },
  },
})
