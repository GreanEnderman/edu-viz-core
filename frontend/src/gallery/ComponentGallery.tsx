import { useState, useEffect } from 'react'
import { ComponentListView } from './ComponentListView'
import { ComponentDetail } from './ComponentDetail'

/**
 * A2UI 组件预览库主容器
 * 处理 URL 参数和视图路由
 */
export function ComponentGallery() {
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // 初始化：从 URL 读取参数
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const componentId = urlParams.get('component')
    setSelectedComponentId(componentId)
  }, [])

  // 监听浏览器前进/后退
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search)
      setSelectedComponentId(urlParams.get('component'))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // 导航到详情页
  const navigateToDetail = (componentId: string) => {
    const newUrl = `${window.location.pathname}?gallery=1&component=${componentId}`
    window.history.pushState({}, '', newUrl)
    setSelectedComponentId(componentId)
  }

  // 返回列表
  const navigateToList = () => {
    const newUrl = `${window.location.pathname}?gallery=1`
    window.history.pushState({}, '', newUrl)
    setSelectedComponentId(null)
  }

  // 视图切换
  if (selectedComponentId) {
    return (
      <ComponentDetail
        componentId={selectedComponentId}
        onBack={navigateToList}
        onNavigateToComponent={navigateToDetail}
      />
    )
  }

  return (
    <ComponentListView
      selectedCategory={selectedCategory}
      onSelectCategory={setSelectedCategory}
      onSelectComponent={navigateToDetail}
    />
  )
}
