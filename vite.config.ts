import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    // Proxy for Netlify functions during local development.
    // This forwards requests from the Vite dev server to the Netlify dev server.
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888', // Default port for `netlify dev`
        changeOrigin: true,
      },
    },
  },
})
