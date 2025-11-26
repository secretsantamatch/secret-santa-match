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
        main: resolve(__dirname, 'index.html'), // Blog is now the main entry
        generator: resolve(__dirname, 'generator.html'), // Generator has its own page
        'white-elephant-generator': resolve(__dirname, 'white-elephant-generator.html'), // New White Elephant page
        contact: resolve(__dirname, 'contact.html'),
        'about-us': resolve(__dirname, 'public/about-us.html'),
        'advertise': resolve(__dirname, 'public/advertise.html'),
        'minimum-payment-calculator': resolve(__dirname, 'minimum-payment-calculator.html'),
        'holiday-budget-calculator': resolve(__dirname, 'holiday-budget-calculator.html'),
        'terms-of-service': resolve(__dirname, 'terms-of-service.html'),
        'complete-secret-santa-comparison': resolve(__dirname, 'complete-secret-santa-comparison.html'),
        'free-printables': resolve(__dirname, 'free-printables.html'),
         'are-gift-cards-good-gifts': resolve(__dirname, 'are-gift-cards-good-gifts.html'),
        'digital-vs-physical-gift-cards': resolve(__dirname, 'digital-vs-physical-gift-cards.html'),
        'creative-ways-to-give-gift-cards': resolve(__dirname, 'creative-ways-to-give-gift-cards.html'),
        'gift-card-etiquette': resolve(__dirname, 'gift-card-etiquette.html'),
        'ultimate-guide-buying-gift-cards': resolve(__dirname, 'ultimate-guide-buying-gift-cards.html'),

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
