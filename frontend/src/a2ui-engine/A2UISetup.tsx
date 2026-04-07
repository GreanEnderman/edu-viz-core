import { useEffect, useRef, type ReactNode } from 'react'
import { A2UIProvider } from '@a2ui/react'
import { setupDefaultCatalog, loadPluginComponents } from './CatalogRegistry'

interface A2UISetupProps {
  children: ReactNode
}

/**
 * 直接修改 A2UI 注入的 <style> 标签文本，替换默认字体为项目字体。
 * A2UI 通过 injectStyles() 写入 id="a2ui-structural-styles" 的 <style>，
 * --default-font-family 写死为 Helvetica。修改textContent是唯一可靠的方式。
 */
function overrideA2UIFonts() {
  const styleEl = document.getElementById('a2ui-structural-styles')
  if (!styleEl || !styleEl.textContent) return

  // 替换 --default-font-family 的值（匹配冒号到分号的全部内容）
  styleEl.textContent = styleEl.textContent
    .replace(
      /--default-font-family:\s*[^;]+;/,
      '--default-font-family: "Newsreader", "Noto Serif SC", serif;'
    )
}

export function A2UISetup({ children }: A2UISetupProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    setupDefaultCatalog()
    // ensureInitialized() 在 A2UIProvider 渲染时同步执行 injectStyles()
    // useEffect 在渲染后执行，<style> 标签已存在
    overrideA2UIFonts()
    // Load plugin components asynchronously after default catalog is ready
    if (import.meta.env.VITE_USE_MOCK !== 'true') {
      loadPluginComponents()
    }
  }, [])

  return <A2UIProvider>{children}</A2UIProvider>
}
