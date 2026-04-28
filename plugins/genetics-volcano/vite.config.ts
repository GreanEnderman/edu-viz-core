import { defineConfig } from 'vite'
import { createPluginViteConfig } from '../../packages/plugin-runtime/vite-preset.mjs'

export default defineConfig({
  ...createPluginViteConfig(__dirname),
})
