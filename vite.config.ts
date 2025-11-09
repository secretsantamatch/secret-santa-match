import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        generator: resolve(__dirname, 'generator.html'),
        contact: resolve(__dirname, 'contact.html'),
        'about-us': resolve(__dirname, 'public/about-us.html'),
        'advertise': resolve(__dirname, 'public/advertise.html'),
        'minimum-payment-calculator': resolve(__dirname, 'minimum-payment-calculator.html'),
        'holiday-budget-calculator': resolve(__dirname, 'holiday-budget-calculator.html'),
        // New entry for the wishlist editor
        'wishlist-editor': resolve(__dirname, 'wishlist-editor.html'),
      }
    }
  },
  server: {
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
})
