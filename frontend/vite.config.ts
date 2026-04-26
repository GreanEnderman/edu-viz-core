import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const cacheNamespace = process.env.VITE_CACHE_NAMESPACE ?? `session-${Date.now()}`

export default defineConfig({
  plugins: [react(), tailwindcss()],
  cacheDir: resolve(currentDir, '.vite-cache', cacheNamespace),
  build: {
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@plugins': resolve(currentDir, '../plugins'),
    },
  },
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/plugins': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
