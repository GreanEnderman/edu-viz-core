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
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: [
      { find: 'react/jsx-runtime', replacement: resolve(currentDir, '../node_modules/react/jsx-runtime.js') },
      { find: 'react-dom/client', replacement: resolve(currentDir, '../node_modules/react-dom/client.js') },
      { find: 'react-dom', replacement: resolve(currentDir, '../node_modules/react-dom') },
      { find: 'react', replacement: resolve(currentDir, '../node_modules/react') },
      { find: '@plugins', replacement: resolve(currentDir, '../plugins') },
    ],
  },
  server: {
    port: 5174,
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
