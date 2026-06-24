import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'KappaSport Analytics',
        short_name: 'KappaSport',
        description: 'Dashboard per l\'analisi dei dati atletici KappaSport',
        theme_color: '#18181b',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        // Precache everything generated at build time
        globPatterns: ['**/*.{js,css,html,svg}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // All data stays local — no runtime caching needed for external requests
        runtimeCaching: [],
      },
      devOptions: {
        // Keep disabled in dev to avoid interfering with HMR
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('recharts') || id.includes('d3-')) return 'recharts'
          if (id.includes('papaparse')) return 'parsers'
          if (id.includes('xlsx')) return 'xlsx'
          if (id.includes('@base-ui')) return 'base-ui'
          if (id.includes('idb-keyval')) return 'idb'
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
