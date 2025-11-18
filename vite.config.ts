import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// FIX: In an ES module, `__dirname` is not available. `dirname` from `path` and `fileURLToPath` from `url` are imported to define it.
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// FIX: Define `__filename` and `__dirname` for ES module scope to resolve path correctly.
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
        'white-elephant-generator': resolve(__dirname, 'white-elephant-generator.html'), 
        contact: resolve(__dirname, 'contact.html'),
        'about-us': resolve(__dirname, 'public/about-us.html'),
        'advertise': resolve(__dirname, 'public/advertise.html'),
        'minimum-payment-calculator': resolve(__dirname, 'minimum-payment-calculator.html'),
        'holiday-budget-calculator': resolve(__dirname, 'holiday-budget-calculator.html'),
       'terms-of-service': resolve(__dirname, 'terms-of-service.html'),
        'complete-secret-santa-comparison': resolve(__dirname, 'complete-secret-santa-comparison.html')
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
