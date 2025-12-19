import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({ 
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'DoneSwipe',
        short_name: 'DoneSwipe',
        description: 'Swipe to Done. Experience the most satisfying task manager.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
            {
                src: 'icon.svg',
                sizes: '192x192',
                type: 'image/svg+xml'
            },
            {
                src: 'icon.svg',
                sizes: '512x512',
                type: 'image/svg+xml'
            }
        ]
      }
    })
  ],
})
