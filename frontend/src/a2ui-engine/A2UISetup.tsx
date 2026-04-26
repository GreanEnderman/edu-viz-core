import { useEffect, useRef, useState, type ReactNode } from 'react'
import { A2UIProvider } from '@a2ui/react'
import { setupDefaultCatalog, loadPluginComponents } from './CatalogRegistry'

interface A2UISetupProps {
  children: ReactNode
}

function overrideA2UIFonts() {
  const styleEl = document.getElementById('a2ui-structural-styles')
  if (!styleEl || !styleEl.textContent) return

  styleEl.textContent = styleEl.textContent.replace(
    /--default-font-family:\s*[^;]+;/,
    '--default-font-family: "Newsreader", "Noto Serif SC", serif;'
  )
}

export function A2UISetup({ children }: A2UISetupProps) {
  const initialized = useRef(false)
  const [isCatalogReady, setIsCatalogReady] = useState(import.meta.env.VITE_USE_MOCK === 'true')

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const bootstrapCatalog = async () => {
      setupDefaultCatalog()
      overrideA2UIFonts()

      if (import.meta.env.VITE_USE_MOCK !== 'true') {
        await loadPluginComponents()
      }

      setIsCatalogReady(true)
    }

    bootstrapCatalog().catch((err) => {
      console.error('[A2UISetup] Failed to initialize catalog:', err)
      setIsCatalogReady(true)
    })
  }, [])

  // @ts-expect-error -- @a2ui/react bundles a separate React type copy; runtime children are valid.
  return <A2UIProvider>{isCatalogReady ? children : null}</A2UIProvider>
}
