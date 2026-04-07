## ADDED Requirements

### Requirement: A2UIProvider 全局初始化
`A2UISetup.tsx` SHALL 导出包装组件 `A2UISetup`，在首次挂载时（`useEffect` 执行一次）调用 `injectStyles()` 和 `initializeDefaultCatalog()`，并以 `A2UIProvider` 包裹子树。

#### Scenario: 应用启动
- **WHEN** `App.tsx` 渲染 `<A2UISetup>`
- **THEN** A2UI 样式注入到 document head，默认组件目录完成初始化，子组件可消费 A2UI context

#### Scenario: 多次挂载不重复初始化
- **WHEN** `A2UISetup` 在同一会话中经历 unmount 后再次 mount
- **THEN** `injectStyles` 和 `initializeDefaultCatalog` 不重复执行（幂等）

### Requirement: 默认组件目录注册
`CatalogRegistry.ts` SHALL 导出函数 `setupDefaultCatalog()`，调用 `@a2ui/react` 的 `registerDefaultCatalog`，将标准内置组件注册到 `ComponentRegistry`。此函数 SHALL 在 `A2UISetup` 初始化阶段被调用。

#### Scenario: 标准组件可用
- **WHEN** `setupDefaultCatalog()` 执行完毕
- **THEN** `ComponentRegistry` 中包含 `@a2ui/react` 的全部默认组件，`A2UIRenderer` 可渲染这些组件

### Requirement: 插件注册扩展点
`CatalogRegistry.ts` SHALL 预留 `registerPluginComponents(components: PluginComponent[])` 函数签名，M2 阶段函数体为空（无实现），供 M3 插件接入时填充。

#### Scenario: M2 阶段调用
- **WHEN** 调用 `registerPluginComponents([])`
- **THEN** 不抛出异常，无任何副作用
