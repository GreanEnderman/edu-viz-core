## Context

当前系统（M2）已实现流式对话 + A2UI 标准组件渲染，但插件支持停留在占位阶段：`CatalogRegistry.ts` 的 `registerPluginComponents` 为空实现，`prompt_builder.py` 的 `plugin_capabilities` 参数始终以空值调用。

本 change 需要构建完整的插件生命周期：**后端发现插件 → 用户控制启用状态 → 前端动态加载组件 → LLM 感知并调用插件**。插件由我们团队开发并随应用发布，用户可按学科需求启用/禁用，不涉及第三方安装。

## Goals / Non-Goals

**Goals:**
- 后端启动时自动扫描并加载 `/plugins/` 目录下的所有 manifest.json
- 按用户粒度维护插件启用/禁用状态（不同用户可启用不同插件）
- 前端根据用户已启用插件动态加载 ESM 组件，注册到 A2UI ComponentRegistry
- LLM system prompt 中自动包含当前用户已启用插件的 capabilities（props_schema、a2ui_hint）
- 提供插件管理 UI（风格与主页面一致）
- 实现首个示例插件 `physics-high-school`，验证全链路

**Non-Goals:**
- 用户自行上传/安装插件（插件始终由我们提供）
- 插件版本管理或热更新（随应用发版统一更新）
- 插件间依赖关系
- 插件沙箱/安全隔离（均为可信内部插件）

## Decisions

### D1：插件 JS 采用 ESM 动态 import()，React 作为 external

**决策**：每个插件独立构建为 ESM bundle（`dist/index.esm.js`），将 React/ReactDOM 标记为 external。前端通过 `import()` 按需加载，不打入主 bundle。

**理由**：
- 避免将所有插件打包进主应用（按需加载）
- 避免多份 React 实例冲突（external 确保共享宿主的 React）
- Vite 原生支持动态 import，实现简单

**替代方案**：Module Federation（过重，增加构建复杂度）；Web Components（失去 React 生态；插件开发者需学习不同范式）。

---

### D2：插件状态存储在数据库，按用户维护

**决策**：新增 `plugin_user_settings` 表（`user_id TEXT, plugin_id TEXT, enabled INTEGER`，PK 为 `(user_id, plugin_id)`）。首次查询时若记录不存在，默认返回 disabled（需用户主动启用）。

**理由**：不同学科的用户启用不同插件，符合个性化学习路径的需求。全局开关无法满足这一需求。

**替代方案**：JSON 配置文件（无法按用户区分）；内存状态（重启丢失）。

---

### D3：manifest.json 新增 `entry.js` 字段

**决策**：manifest 增加 `entry.js`（相对路径，指向插件构建产物，如 `dist/index.esm.js`）。后端通过 FastAPI StaticFiles 挂载 `/plugins/` 目录，使前端可通过 `<origin>/plugins/{id}/{entry.js}` 加载。

```json
{
  "entry": {
    "js": "dist/index.esm.js",
    "vector_db": "knowledge/vector.db"
  }
}
```

这是对原有规范的 **BREAKING 变更**（原文档注明"无 js 字段，改用 React 静态导入"）。需同步更新 `design/architecture.md`。

---

### D4：插件组件通过 default export 暴露，index.ts 导出 metadata

**决策**：插件 `dist/index.esm.js` 的 default export 为组件映射对象：

```ts
export default {
  components: {
    PhysicsOscillator: PhysicsOscillatorComponent
  }
}
```

前端加载后从 `default.components` 中取出各组件，按 `component_id` 注册到 ComponentRegistry。

**理由**：一个插件可包含多个组件，对象映射比单组件 export 更可扩展；避免动态 export 名称依赖。

---

### D5：prompt_builder 从 registry 获取 capabilities，不通过参数传递

**决策**：`build_system_prompt` 不再接受 `plugin_capabilities` 参数；改为接受 `user_id`，内部从 `PluginRegistry` 查询该用户已启用插件的 capabilities。

**理由**：调用方（chat router）不应关心插件数据获取细节；registry 是单例，直接访问更简洁。现有的 `plugin_capabilities: list[dict] | None` 参数虽已有但始终为 None，修改无实际破坏性影响。

---

### D6：插件管理 UI 作为设置页面，不做全屏路由

**决策**：在主界面新增一个「插件」入口（侧边栏底部），展示一个 modal 或内嵌面板，列出所有可用插件卡片 + 开关。不新增独立路由页面。

**理由**：插件管理是低频操作，不值得独占路由；modal/面板形式减少开发量，同时保持 UI 风格一致性。

## Risks / Trade-offs

**[ESM 动态加载的 CORS 限制]** → 开发环境下 Vite dev server 与 FastAPI 不同源，动态 import URL 需跨域。缓解：FastAPI StaticFiles 已配置 CORS，或开发时通过 Vite proxy 转发 `/plugins/` 路径。

**[React external 版本绑定]** → 插件构建时锁定了 React 版本作为 external 假设。若主应用升级 React 而插件未重建，可能出现不兼容。缓解：插件随应用统一发版，版本由我们控制。

**[manifest 扫描时机]** → 后端仅在启动时扫描一次，运行时新增插件不会被发现。缓解：当前场景（插件随应用发布）不需要热发现，重启成本可接受。

**[插件 UI 初版功能有限]** → 首版插件管理 UI 仅支持启用/禁用，无插件详情、预览或说明。这是有意为之的范围控制，后续可迭代。

## Migration Plan

1. 更新 `design/architecture.md` 插件规范（新增 `entry.js` 字段说明）
2. 新增数据库表 `plugin_user_settings`（在 `db/schema.sql` 或 init 逻辑中添加，随 `init_db()` 创建）
3. 实现后端插件基础设施（models → loader → registry → API → prompt_builder 集成）
4. 实现前端动态加载（CatalogRegistry 重构）+ 插件管理 UI
5. 实现 `physics-high-school` 插件，端到端验证
6. 提供开发者工具（脚手架 + manifest prompt 模板 + 知识库 CLI）

回滚：插件系统为增量功能，不影响现有对话流程。若插件加载失败，系统应降级为无插件状态正常运行（loader 容错设计）。

## Open Questions

- **知识库格式**：向量库使用 ChromaDB、FAISS 还是 Qdrant？目前 M3 插件任务和 RAG（M5）并行，建议 M3 阶段插件的 `vector.db` 占位即可，M5 再统一确定格式。
- **用户身份**：当前系统的"用户"是否已有 `user_id`（本地单用户还是多用户）？`plugin_user_settings` 的 `user_id` 外键依赖用户表结构，需确认。
