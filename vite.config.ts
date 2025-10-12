import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        blog: './blog.html',
        'minimum-payment-calculator': './minimum-payment-calculator.html'
      }
    }
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
