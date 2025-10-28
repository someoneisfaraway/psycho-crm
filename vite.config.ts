import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      manifest: {
        name: 'Psychological Practice Support Tool',
        short_name: 'PsychoCRM',
        description: 'CRM for psychologists and psychoanalysts',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icon: 'public/icon.png'
      }
    })
  ],
})
