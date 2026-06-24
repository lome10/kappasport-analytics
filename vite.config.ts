import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
