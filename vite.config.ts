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
        blog: resolve(__dirname, 'blog.html'),
        generator: resolve(__dirname, 'generator.html'),
        'holiday-budget-calculator': resolve(__dirname, 'holiday-budget-calculator.html'),
        'minimum-payment-calculator': resolve(__dirname, 'minimum-payment-calculator.html'),
        'about-us': resolve(__dirname, 'public/about-us.html'),
        'advertise': resolve(__dirname, 'public/advertise.html'),
        'privacy-policy': resolve(__dirname, 'public/privacy-policy.html'),
        'secret-santa-questionnaire': resolve(__dirname, 'public/secret-santa-questionnaire.html'),
        'complete-secret-santa-comparison': resolve(__dirname, 'public/complete-secret-santa-comparison.html'),
        'how-to-do-secret-santa': resolve(__dirname, 'public/how-to-do-secret-santa.html'),
        'what-to-ask-for-in-secret-santa': resolve(__dirname, 'public/what-to-ask-for-in-secret-santa.html'),
        'what-to-write-in-a-secret-santa-card': resolve(__dirname, 'public/what-to-write-in-a-secret-santa-card.html'),
        'secret-santa-rules': resolve(__dirname, 'public/secret-santa-rules.html'),
        'halloween-party-games': resolve(__dirname, 'public/halloween-party-games.html'),
        'halloween-word-search-printables': resolve(__dirname, 'public/halloween-word-search-printables.html'),
        'white-elephant-rules': resolve(__dirname, 'public/white-elephant-rules.html'),
        'white-elephant-gifts-under-20': resolve(__dirname, 'public/white-elephant-gifts-under-20.html'),
        'drawnames-alternative': resolve(__dirname, 'public/drawnames-alternative.html'),
        'elfster-alternative': resolve(__dirname, 'public/elfster-alternative.html'),
        'credit-karma-features': resolve(__dirname, 'public/credit-karma-features.html'),
        'streaming-gifts-2025': resolve(__dirname, 'public/streaming-gifts-2025.html'),
        'last-minute-drug-store-gifts': resolve(__dirname, 'public/last-minute-drug-store-gifts.html'),
        'credit-card-vs-debit-card': resolve(__dirname, 'public/credit-card-vs-debit-card.html'),
        'free-nice-list-certificates': resolve(__dirname, 'public/free-nice-list-certificates.html'),
        'how-to-use-secret-santa-match': resolve(__dirname, 'public/how-to-use-secret-santa-match.html'),
        'secret-santa-bingo-guide': resolve(__dirname, 'public/secret-santa-bingo-guide.html'),
        'how-to-organize-secret-santa': resolve(__dirname, 'public/how-to-organize-secret-santa.html'),
      }
    }
  },
  server: {
    // Proxy for Netlify functions during local development
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
})
