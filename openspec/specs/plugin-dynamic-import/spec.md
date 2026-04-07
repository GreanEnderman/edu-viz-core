## ADDED Requirements

### Requirement: 前端启动时动态加载已启用插件
系统 SHALL 在应用初始化阶段（`setupDefaultCatalog` 调用后）请求 `GET /api/v1/plugins`，对每个 `enabled: true` 的插件执行 ESM 动态 import()，加载其 JS bundle，并将导出的组件注册到 A2UI `ComponentRegistry`。

#### Scenario: 启动时加载已启用插件的组件
- **WHEN** 应用启动，`GET /api/v1/plugins` 返回 `physics-high-school` 且 `enabled: true`
- **THEN** `PhysicsOscillator` 被注册到 `ComponentRegistry`，`ComponentRegistry.getInstance().resolve("PhysicsOscillator")` 返回有效组件

#### Scenario: 插件 JS 加载失败时不影响应用启动
- **WHEN** 某个 enabled 插件的 JS URL 请求失败（网络错误或 404）
- **THEN** 该插件加载被跳过，控制台输出 ERROR 日志，其他插件和标准组件正常可用

#### Scenario: 无已启用插件时正常启动
- **WHEN** `GET /api/v1/plugins` 返回空列表或所有插件均为 disabled
- **THEN** 应用正常启动，ComponentRegistry 只包含标准组件

---

### Requirement: 插件 ESM bundle 导出规范
插件 `dist/index.esm.js` 的 default export SHALL 为以下结构的对象：

```ts
{
  components: Record<string, React.ComponentType>
}
```

其中 key 与 manifest `capabilities[].component_id` 一致。

#### Scenario: 前端从 default export 中提取组件
- **WHEN** 动态 import 插件模块，模块 default export 包含 `{ components: { PhysicsOscillator: <Component> } }`
- **THEN** 前端将 `PhysicsOscillator` 注册到 ComponentRegistry，key 为 `"PhysicsOscillator"`

#### Scenario: default export 缺少 components 字段时跳过
- **WHEN** 动态 import 插件模块，模块 default export 不含 `components` 字段
- **THEN** 该插件加载被跳过，输出 WARNING 日志
