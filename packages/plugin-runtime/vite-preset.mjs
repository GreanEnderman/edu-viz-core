import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const SHARED_RUNTIME_EXTERNALS = [
  'react',
  'react-dom',
  '@a2ui/react',
  'react/jsx-runtime',
]

export function createPluginViteConfig(dirname) {
  return {
    plugins: [react()],
    build: {
      lib: {
        entry: resolve(dirname, 'src/index.ts'),
        formats: ['es'],
        fileName: 'index.esm',
      },
      rollupOptions: {
        external: SHARED_RUNTIME_EXTERNALS,
      },
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
}

export { SHARED_RUNTIME_EXTERNALS }
