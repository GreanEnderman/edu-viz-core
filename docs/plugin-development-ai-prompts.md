# AhaTutor 插件开发 AI 提示词补充指南

> 这份文档是《插件开发指南》的补充，专门为使用 AI 工具（Claude、GPT、DeepSeek 等）开发插件的场景设计。
>
> 它包含了宿主代码的实际行为细节、关键约束、以及可以直接复制给 AI 的提示词模板。

---

## 目录

1. [前端组件加载机制的完整约束](#1-前端组件加载机制的完整约束)
2. [共享依赖验证机制](#2-共享依赖验证机制)
3. [插件后端返回值协议](#3-插件后端返回值协议)
4. [Python 模块路径命名规则](#4-python-模块路径命名规则)
5. [插件加载与注册流程](#5-插件加载与注册流程)
6. [组件 ID 注册机制](#6-组件-id-注册机制)
7. [Gallery 自动生成机制](#7-gallery-自动生成机制)
8. [完整的 AI 开发提示词模板](#8-完整的-ai-开发提示词模板)

---

## 1. 前端组件加载机制的完整约束

### 宿主实际行为

AhaTutor 宿主支持**两种**前端组件加载方式（按优先级）：

**方式 1：从 `src/index.ts` 统一导出（推荐）**
```ts
// src/index.ts
import MoleculeViewer from './MoleculeViewer'
import PeriodicTable from './PeriodicTable'

export default {
  components: {
    MoleculeViewer,
    PeriodicTable,
  },
}
```

**方式 2：直接从组件文件导出（回退机制）**
```ts
// src/MoleculeViewer.tsx
export default function MoleculeViewer({ node }: { node: A2UINode }) {
  // ...
}
```


宿主加载逻辑（`frontend/src/a2ui-engine/CatalogRegistry.ts`）：
1. 优先尝试加载 `src/index.ts` 的 `default.components[component_id]`
2. 如果找不到，回退到 `src/${component_id}.tsx` 的默认导出
3. 如果都找不到，在控制台输出警告并跳过该 capability

### 给 AI 的约束提示词

```text
【前端组件导出约束】

AhaTutor 宿主支持两种组件导出方式：

1. **多组件插件（推荐）**：在 src/index.ts 中统一导出
   ```ts
   export default {
     components: {
       ComponentA,
       ComponentB,
     },
   }
   ```
   components 的 key 必须与 manifest.json 中的 component_id 完全一致。

2. **单组件插件（简化方式）**：直接在 src/ComponentName.tsx 中默认导出
   ```ts
   export default function ComponentName({ node }: { node: A2UINode }) { ... }
   ```
   文件名必须与 manifest.json 中的 component_id 完全一致。

如果你生成的是多组件插件，必须使用方式 1。
如果你生成的是单组件插件，可以使用方式 2 简化结构。

验证清单：
- [ ] component_id 与导出的 key/文件名完全一致（大小写敏感）
- [ ] 组件签名是 ({ node }: { node: A2UINode })
- [ ] 如果使用 src/index.ts，确保 export default { components: {...} } 格式正确
```

---

## 2. 共享依赖验证机制

### 宿主实际行为

宿主会验证插件声明的 `sharedDependencies` 是否被支持：

- 验证逻辑在 `frontend/src/a2ui-engine/CatalogRegistry.ts` 的 `validateSharedDependencies` 函数
- 当前支持的共享依赖定义在 `packages/plugin-runtime/src` 中
- 如果插件声明了不支持的依赖，**整个插件会被跳过加载**
- 控制台会输出警告：`[CatalogRegistry] Plugin 'xxx' requested unsupported shared dependency 'yyy'`

### 当前支持的共享依赖列表

```json
["react", "react-dom", "@a2ui/react"]
```

### 给 AI 的约束提示词

```text
【共享依赖约束】

在生成 manifest.json 时，sharedDependencies 字段只能包含以下依赖：
- "react"
- "react-dom"
- "@a2ui/react"

这些依赖由宿主统一提供，插件不需要也不应该自己安装。

如果你认为插件需要其他依赖，必须：
1. 先说明为什么需要这个依赖
2. 说明为什么不能用原生 API 或已有共享依赖实现
3. 说明这个依赖的体积和维护成本
4. 将其作为插件私有依赖，而不是共享依赖

错误示例：
```json
"sharedDependencies": ["react", "react-dom", "@a2ui/react", "three"]  // ❌ three 不是共享依赖
```

正确示例：
```json
"sharedDependencies": ["react", "react-dom", "@a2ui/react"]  // ✅
```

验证清单：
- [ ] sharedDependencies 只包含上述三个依赖
- [ ] 没有将插件私有依赖写入 sharedDependencies
```

---

## 3. 插件后端返回值协议

### 宿主实际行为

插件后端的 `invoke` 函数返回值会被宿主特殊处理（`backend/app/routers/plugins.py`）：

**情况 1：返回包含 `success` 字段**
```python
# 成功时
return {"success": True, "atoms": [...], "bonds": [...]}
# 宿主提取：data = {"atoms": [...], "bonds": [...]}

# 失败时
return {"success": False, "error": "Invalid molecule name"}
# 宿主提取：error = "Invalid molecule name"
```

**情况 2：返回不包含 `success` 字段**
```python
return {"atoms": [...], "bonds": [...]}
# 宿主认为调用成功，整个字典作为 data
```

### 给 AI 的约束提示词

```text
【插件后端返回值协议】

当你生成插件后端的 invoke 函数时，返回值必须遵循以下协议：

**推荐格式 1：简单返回（用于总是成功的场景）**
```python
async def invoke(action: str, payload: dict, context: dict) -> dict:
    if action == "generate_structure":
        result = generate_structure(payload["molecule_name"])
        return {
            "atoms": result.atoms,
            "bonds": result.bonds
        }
    raise ValueError(f"Unsupported action: {action}")
```

**推荐格式 2：显式成功/失败（用于可能失败的场景）**
```python
async def invoke(action: str, payload: dict, context: dict) -> dict:
    if action == "generate_structure":
        molecule_name = payload.get("molecule_name")
        if not molecule_name:
            return {
                "success": False,
                "error": "molecule_name is required"
            }
        
        try:
            result = generate_structure(molecule_name)
            return {
                "success": True,
                "atoms": result.atoms,
                "bonds": result.bonds
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
```

关键约束：
- 返回值必须是 dict，且可 JSON 序列化
- 如果使用 success 字段，True 表示成功，False 表示失败
- 失败时必须提供 error 字段说明原因
- 不要抛出未捕获的异常（宿主会捕获，但会返回完整堆栈，不够友好）

验证清单：
- [ ] 返回值是 dict 类型
- [ ] 所有值都可 JSON 序列化（不包含 Python 对象、函数等）
- [ ] 如果可能失败，使用 success + error 模式
- [ ] 对非法 action 抛出 ValueError
```

---

## 4. Python 模块路径命名规则

### 宿主实际行为

宿主的插件后端加载器（`backend/app/routers/plugins.py` 的 `_load_plugin_module`）支持两种模块路径格式：

**格式 1：标准 Python 路径（推荐）**
- 插件目录：`plugins/chemistry-molecule-3d/`
- manifest.json：`"python_module": "plugins.chemistry_molecule_3d.backend"`
- 宿主会先尝试标准 Python 导入

**格式 2：带连字符路径（兼容性支持）**
- 插件目录：`plugins/chemistry-molecule-3d/`
- manifest.json：`"python_module": "plugins.chemistry-molecule-3d.backend"`
- 如果标准导入失败，宿主会从文件路径直接加载

### 给 AI 的约束提示词

```text
【Python 模块路径命名约束】

当你生成带后端的插件时，manifest.json 中的 entry.python_module 字段命名规则：

**推荐写法：将插件 ID 中的连字符替换为下划线**

插件目录名：chemistry-molecule-3d
Python 模块路径：plugins.chemistry_molecule_3d.backend

示例：
```json
{
  "id": "chemistry-molecule-3d",
  "entry": {
    "python_module": "plugins.chemistry_molecule_3d.backend"
  }
}
```

**兼容写法：保持连字符（宿主会特殊处理）**
```json
{
  "id": "chemistry-molecule-3d",
  "entry": {
    "python_module": "plugins.chemistry-molecule-3d.backend"
  }
}
```

两种写法都可以工作，但推荐使用第一种（下划线），因为它符合 Python 标准。

后端文件结构：
```
plugins/chemistry-molecule-3d/
├── backend/
│   ├── __init__.py      # 必须有，可以为空
│   └── service.py       # 或其他名称
```

如果 python_module 是 "plugins.chemistry_molecule_3d.backend"，宿主会加载 backend/__init__.py
如果 python_module 是 "plugins.chemistry_molecule_3d.backend.service"，宿主会加载 backend/service.py

验证清单：
- [ ] python_module 路径中的插件名部分使用下划线（推荐）或连字符（兼容）
- [ ] 对应的 Python 文件或包确实存在
- [ ] 如果是包（目录），必须有 __init__.py
- [ ] 模块中必须有 async def invoke(action, payload, context) 函数
```

---

## 5. 插件加载与注册流程

### 宿主实际行为

**后端启动时：**
1. 扫描 `plugins/` 目录（跳过 `_` 和 `.` 开头的目录）
2. 读取每个插件的 `manifest.json`
3. 使用 Pydantic 验证并加载到 PluginRegistry
4. 存储在内存中供后续查询

**前端启动时：**
1. 从 `/api/v1/plugins` 获取所有插件清单
2. 根据数据库中的用户设置过滤出启用的插件
3. 验证每个插件的 `sharedDependencies`
4. 动态加载启用插件的前端组件（使用 `import.meta.glob`）
5. 注册组件到 A2UI ComponentRegistry
6. 自动生成 Gallery 预览

### 调试检查点

如果插件没有出现在 Gallery 或对话中，按顺序检查：

1. **后端是否扫描到插件**
   - 检查后端日志：`Loaded plugin 'xxx' (xxx)`
   - 访问 `/api/v1/plugins` 查看插件列表

2. **插件是否被启用**
   - 检查数据库 `plugin_user_settings` 表
   - 或通过 `/api/v1/plugins` 返回的 `enabled` 字段

3. **前端是否加载成功**
   - 打开浏览器控制台
   - 查找 `[CatalogRegistry] Registered plugin component: xxx`
   - 或查找错误信息

4. **组件是否正确注册**
   - 在控制台执行：`ComponentRegistry.getInstance().get('ComponentName')`
   - 应该返回组件对象，而不是 undefined

### 给 AI 的调试提示词

```text
【插件加载流程与调试】

当你生成插件后，告诉开发者按以下步骤验证：

**步骤 1：验证后端加载**
```bash
# 重启后端，查看日志
# 应该看到：Loaded plugin 'your-plugin-id' (插件名称)
```

**步骤 2：验证插件在 API 中可见**
```bash
curl http://localhost:8000/api/v1/plugins
# 应该在返回的 JSON 数组中找到你的插件
```

**步骤 3：启用插件**
```bash
curl -X POST http://localhost:8000/api/v1/plugins/your-plugin-id/toggle
# 返回 {"plugin_id": "your-plugin-id", "enabled": true}
```

**步骤 4：验证前端加载**
```
1. 打开浏览器控制台
2. 刷新页面
3. 查找日志：[CatalogRegistry] Registered plugin component: YourComponent
```

**步骤 5：验证 Gallery**
```
访问 http://localhost:5173/?gallery=1
应该能看到你的插件组件预览
```

常见问题：
- 后端日志没有 "Loaded plugin"：检查 manifest.json 格式是否正确
- API 返回插件但 enabled=false：需要调用 toggle 接口启用
- 前端控制台报错 "No module for plugin"：检查组件文件路径和导出格式
- Gallery 中看不到：检查前端是否成功注册组件
```

---

## 6. 组件 ID 注册机制

### 宿主实际行为

宿主会为每个插件注册**两种**组件 ID：

1. **Capability ID**：每个 `capabilities[].component_id` 都会被注册
2. **Plugin ID 别名**：插件的**第一个** capability 会额外注册为插件 ID

示例：
```json
{
  "id": "chemistry-molecule-3d",
  "capabilities": [
    {"component_id": "MoleculeViewer", ...},
    {"component_id": "PeriodicTable", ...}
  ]
}
```

注册结果：
- `MoleculeViewer` → MoleculeViewer 组件
- `PeriodicTable` → PeriodicTable 组件
- `chemistry-molecule-3d` → MoleculeViewer 组件（别名）

LLM 可以用以下任意方式调用：
```json
{"component": "MoleculeViewer", ...}
{"component": "chemistry-molecule-3d", ...}  // 等价于上面
```

### 给 AI 的约束提示词

```text
【组件 ID 注册机制】

当你生成 manifest.json 时，需要理解组件注册规则：

1. 每个 capability 的 component_id 都会被注册为独立组件
2. 第一个 capability 的组件会额外注册为插件 ID 的别名
3. LLM 可以用 component_id 或 plugin_id 来调用第一个组件

设计建议：
- 将最主要、最常用的组件放在 capabilities 数组的第一位
- 如果插件只有一个组件，component_id 和 plugin_id 可以不同，但建议相关
- 如果插件有多个组件，第一个应该是"代表性"组件

示例 1：单组件插件
```json
{
  "id": "math-function-plotter",
  "capabilities": [
    {"component_id": "FunctionPlotter", ...}
  ]
}
```
LLM 可以用 "FunctionPlotter" 或 "math-function-plotter" 调用。

示例 2：多组件插件
```json
{
  "id": "chemistry-toolkit",
  "capabilities": [
    {"component_id": "MoleculeViewer", ...},    // 主组件，放第一位
    {"component_id": "PeriodicTable", ...},
    {"component_id": "ReactionEquation", ...}
  ]
}
```
LLM 可以用 "chemistry-toolkit" 调用 MoleculeViewer（最常用的）。

验证清单：
- [ ] 最重要的组件放在 capabilities 第一位
- [ ] component_id 使用 PascalCase
- [ ] plugin_id 使用 kebab-case
```

---

## 7. Gallery 自动生成机制

### 宿主实际行为

宿主会自动为每个启用的插件生成 Gallery 预览：

- 调用 `buildPluginGalleryExamples(plugin.id, plugin.name, plugin.capabilities)`
- 基于 `manifest.json` 中的 `capabilities` 和 `props_schema` 自动构建示例
- 使用 `props_schema` 中的 `default` 值作为预览参数
- 开发者无需手动编写 Gallery 代码

### 自定义 Gallery 示例（可选）

如果自动生成的预览不够理想，可以在 `frontend/src/gallery/componentExamples.ts` 中手动添加：

```ts
export const componentExamples = [
  // ... 其他示例
  {
    id: 'my-plugin-custom',
    title: '我的插件 - 自定义示例',
    messages: [
      {
        role: 'assistant',
        content: [
          {
            type: 'component',
            component: 'MyComponent',
            properties: {
              customProp: 'custom value',
            },
          },
        ],
      },
    ],
  },
]
```

### 给 AI 的约束提示词

```text
【Gallery 预览机制】

当你生成插件时，Gallery 预览会自动生成，无需额外代码。

自动预览基于 manifest.json 中的信息：
- 使用 props_schema 中的 default 值
- 为每个 capability 生成一个预览条目
- 在 http://localhost:5173/?gallery=1 中可见

确保 props_schema 中的 default 值是有意义的示例：

好的示例：
```json
{
  "props_schema": {
    "expression": {
      "type": "string",
      "default": "y=x^2",
      "description": "函数表达式"
    },
    "xRange": {
      "type": "array",
      "default": [-10, 10],
      "description": "X 轴范围"
    }
  }
}
```

不好的示例：
```json
{
  "props_schema": {
    "expression": {
      "type": "string",
      "default": "",  // ❌ 空字符串无法展示效果
      "description": "函数表达式"
    }
  }
}
```

验证清单：
- [ ] 每个 prop 都有合理的 default 值
- [ ] default 值能展示组件的典型用法
- [ ] 访问 Gallery 能看到预期的效果
```

---

## 8. 完整的 AI 开发提示词模板

### 8.1 生成插件前端组件（增强版）

```text
请为 AhaTutor 生成一个插件前端组件。

【组件导出约束】
- 组件签名必须是：export default function ComponentName({ node }: { node: A2UINode })
- 参数从 node.properties 读取
- 所有参数必须有默认值和类型安全解析
- 使用辅助函数安全解析参数：
  ```ts
  function parseNum(value: unknown, fallback: number): number {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  ```

【依赖约束】
- 只能使用 React（由宿主提供）
- 优先使用原生 Canvas / SVG / DOM
- 不要引入任何外部依赖
- 不要使用 import 语句导入第三方库

【样式约束】
- 使用 inline style，不要使用 CSS Modules 或外部样式文件
- 背景色：#faf9f5
- 文本色：#1b1c1a
- 主色：#182544
- 强调色：#775a19（谨慎使用）
- 避免硬边框，优先用背景层次和留白

【响应式约束】
- 组件必须能响应 node.properties 的变化
- 使用 useEffect 监听 props 变化并更新内部状态
- 组件必须在聊天页和 Gallery 同时正常工作

【教学表达约束】
- 优先清晰表达教学内容，而不是炫技
- 参数越少越好，但要保留教学表达力
- 内部交互（如缩放、旋转）可以内置，不要暴露为 props

插件需求：
[在这里描述你的插件需求]

请生成 src/ComponentName.tsx 文件。
```

### 8.2 生成插件后端模块（增强版）

```text
请为 AhaTutor 生成一个宿主托管型插件后端模块。

【关键约束】
- 不要生成独立 FastAPI app
- 不要定义独立 HTTP 路由
- 只生成可被宿主调用的 Python 模块

【接口约束】
- 必须提供：async def invoke(action: str, payload: dict, context: dict) -> dict
- 按 action 分发到具体函数
- 返回值必须可 JSON 序列化
- 对非法 action 抛出 ValueError

【返回值协议】
格式 1（简单场景）：
```python
return {
    "atoms": [...],
    "bonds": [...]
}
```

格式 2（可能失败的场景）：
```python
# 成功
return {
    "success": True,
    "atoms": [...],
    "bonds": [...]
}

# 失败
return {
    "success": False,
    "error": "错误描述"
}
```

【错误处理】
- 对非法输入返回 {"success": False, "error": "..."}
- 不要抛出未捕获的异常
- 对空结果、边界情况做显式处理

【代码组织】
- 把第三方库调用封装在小函数里
- 优先无状态、纯函数式设计
- 把计算逻辑与调用协议分开

插件需求：
[在这里描述你的插件需求]

请生成 backend/__init__.py 或 backend/service.py 文件。
```

### 8.3 生成 manifest.json（增强版）

```text
请为 AhaTutor 插件生成 manifest.json。

【必需字段】
- id: 插件唯一标识（kebab-case）
- version: 版本号
- subject: 学科分类
- name: 中文名称
- keywords: 关键词数组（用于意图路由）
- entry: 入口配置
- sharedDependencies: 共享依赖（只能是 ["react", "react-dom", "@a2ui/react"]）
- capabilities: 能力列表

【entry 字段】
纯前端插件：
```json
{
  "js": "dist/index.esm.js",
  "vector_db": "knowledge/vector.db"  // 可选
}
```

带后端插件：
```json
{
  "js": "dist/index.esm.js",
  "python_module": "plugins.plugin_id_with_underscores.backend"
}
```

【backend 字段（如果有后端）】
```json
{
  "kind": "hosted-plugin-service",
  "capabilities": ["action1", "action2"]
}
```

【capabilities 字段】
每个 capability 必须包含：
- component_id: PascalCase，与组件导出名一致
- name: 中文名称
- tags: 标签数组
- props_schema: 参数定义（每个参数必须有 type、default、description）
- a2ui_hint: 告诉 LLM 如何使用（最关键！）
- expresses: 能表达什么
- educational_use: 教学用途
- cannot_express: 不能表达什么

【a2ui_hint 写作要求】
必须说明：
1. 组件适合什么场景
2. LLM 应传哪些关键参数
3. 哪些交互已内置，不要重复生成
4. 如果依赖后端，应该先做什么

好的示例：
"适合展示单个分子的三维结构。若需要真实结构数据，应先通过插件后端 generate_structure 动作生成，再交给组件渲染。组件内部已支持旋转和缩放，不要重复生成这些控制按钮。"

不好的示例：
"这是一个很酷的 3D 组件。"

【props_schema 要求】
- 每个参数必须有合理的 default 值（用于 Gallery 预览）
- default 值应该能展示组件的典型用法
- 数值参数尽量给 min/max
- 参数名用 camelCase

【组件顺序】
- 最重要、最常用的组件放在 capabilities 第一位
- 第一个组件会额外注册为插件 ID 的别名

插件信息：
[在这里提供插件的基本信息]

请生成完整的 manifest.json。
```

### 8.4 完整插件生成（一次性）

```text
我要为 AhaTutor 开发一个新插件，请按以下步骤生成完整代码。

【插件需求】
- 学科：[学科名称]
- 教学场景：[描述教学场景]
- 核心表现：[学生最终看到什么]
- 是否需要后端：[是/否]
- 如果需要后端，说明原因：[为什么前端不够]

【生成步骤】
请按以下顺序生成，每一步都要遵循对应的约束：

**步骤 1：方案设计**
先不要写代码，输出：
1. 推荐的插件 ID（kebab-case）
2. 推荐的组件名（PascalCase）
3. 是否需要后端，如果需要，列出 backend actions
4. 建议暴露给 LLM 的 props 列表（越少越好）
5. 每个 prop 的类型、默认值、合理范围
6. 哪些交互内置在组件，哪些交给外部 A2UI

**步骤 2：生成前端组件**
遵循"8.1 生成插件前端组件"的所有约束。

**步骤 3：生成后端模块（如果需要）**
遵循"8.2 生成插件后端模块"的所有约束。

**步骤 4：生成 src/index.ts**
```ts
import ComponentName from './ComponentName'

export default {
  components: {
    ComponentName,
  },
}
```

**步骤 5：生成 manifest.json**
遵循"8.3 生成 manifest.json"的所有约束。

**步骤 6：生成验证清单**
输出一个检查清单，包括：
- [ ] 文件结构是否完整
- [ ] component_id 与导出名是否一致
- [ ] sharedDependencies 是否只包含允许的依赖
- [ ] props_schema 的 default 值是否合理
- [ ] a2ui_hint 是否足够具体
- [ ] 如果有后端，python_module 路径是否正确
- [ ] 如果有后端，invoke 函数是否正确实现

【关键约束汇总】
1. 不要生成独立前后端项目，这是宿主托管的插件
2. 不要引入外部依赖（除非有充分理由）
3. 共享依赖只能是 react、react-dom、@a2ui/react
4. 组件必须从 node.properties 读取参数
5. 后端必须提供 invoke(action, payload, context) 接口
6. 返回值必须可 JSON 序列化
7. manifest.json 的 a2ui_hint 必须具体明确
8. props_schema 的 default 值必须有意义

现在开始生成插件。
```

---

## 9. 常见错误与修正提示词

### 错误 1：AI 生成了独立的 FastAPI 应用

**症状：**
```python
# backend/main.py
from fastapi import FastAPI

app = FastAPI()

@app.post("/generate")
async def generate(...):
    ...
```

**修正提示词：**
```text
❌ 错误：你生成了独立的 FastAPI 应用。

AhaTutor 插件后端不是独立服务，而是宿主托管的模块。

请重新生成，遵循以下格式：

```python
# backend/__init__.py 或 backend/service.py

async def invoke(action: str, payload: dict, context: dict) -> dict:
    """
    宿主会调用这个函数，不要定义 FastAPI app 和路由。
    """
    if action == "generate_structure":
        return await generate_structure(payload, context)
    
    raise ValueError(f"Unsupported action: {action}")

async def generate_structure(payload: dict, context: dict) -> dict:
    # 实际逻辑
    return {"atoms": [...], "bonds": [...]}
```

不要包含：
- FastAPI app 实例
- @app.post 等路由装饰器
- uvicorn.run 等启动代码
```

### 错误 2：组件没有从 node.properties 读取参数

**症状：**
```tsx
export default function MyComponent({ expression, xRange }: Props) {
  // 直接从 props 读取
}
```

**修正提示词：**
```text
❌ 错误：组件签名不符合 A2UI 规范。

AhaTutor 插件组件必须接收 { node } 参数，从 node.properties 读取数据。

请修改为：

```tsx
interface A2UINode {
  properties?: Record<string, unknown>
}

export default function MyComponent({ node }: { node: A2UINode }) {
  const props = node.properties ?? {}
  
  // 安全解析参数
  const expression = typeof props.expression === 'string' 
    ? props.expression 
    : 'y=x^2'
  
  const xRange = Array.isArray(props.xRange) 
    ? props.xRange 
    : [-10, 10]
  
  // 组件逻辑
}
```

关键点：
- 签名必须是 ({ node }: { node: A2UINode })
- 从 node.properties 读取参数
- 所有参数都要有默认值
- 使用类型安全的解析函数
```

### 错误 3：sharedDependencies 包含不支持的依赖

**症状：**
```json
{
  "sharedDependencies": ["react", "react-dom", "@a2ui/react", "three", "d3"]
}
```

**修正提示词：**
```text
❌ 错误：sharedDependencies 包含不支持的依赖。

当前宿主只支持以下共享依赖：
- react
- react-dom
- @a2ui/react

如果你认为需要 three 或 d3，有两个选择：

选择 1：作为插件私有依赖（不推荐，除非必要）
- 在插件目录下创建 package.json
- 安装依赖并打包到 dist/
- 会增加插件体积

选择 2：用原生 API 实现（推荐）
- 3D 可视化：使用 Canvas + WebGL
- 图表：使用 Canvas 或 SVG
- 数学计算：使用原生 JavaScript

请说明：
1. 为什么需要这个依赖
2. 为什么不能用原生 API 实现
3. 依赖的体积和复杂度

然后我会帮你选择最佳方案。
```

### 错误 4：component_id 与导出名不一致

**症状：**
```json
// manifest.json
{"component_id": "MoleculeViewer"}
```
```ts
// src/index.ts
export default {
  components: {
    MoleculeDisplay,  // ❌ 名称不一致
  },
}
```

**修正提示词：**
```text
❌ 错误：component_id 与组件导出名不一致。

manifest.json 中的 component_id 必须与 src/index.ts 中的导出名完全一致（大小写敏感）。

当前状态：
- manifest.json: "component_id": "MoleculeViewer"
- src/index.ts: components: { MoleculeDisplay }

修正方案 1：统一使用 MoleculeViewer
```json
// manifest.json
{"component_id": "MoleculeViewer"}
```
```ts
// src/MoleculeViewer.tsx
export default function MoleculeViewer({ node }: { node: A2UINode }) { ... }

// src/index.ts
import MoleculeViewer from './MoleculeViewer'
export default {
  components: {
    MoleculeViewer,  // ✅ 一致
  },
}
```

修正方案 2：统一使用 MoleculeDisplay
（同理，两边都改成 MoleculeDisplay）

请选择一个名称并统一修改。
```

### 错误 5：props_schema 的 default 值不合理

**症状：**
```json
{
  "props_schema": {
    "expression": {
      "type": "string",
      "default": "",
      "description": "函数表达式"
    }
  }
}
```

**修正提示词：**
```text
❌ 错误：props_schema 的 default 值为空，无法在 Gallery 中展示效果。

Gallery 预览会使用 default 值渲染组件，空值会导致预览无意义。

请修改为有意义的示例值：

```json
{
  "props_schema": {
    "expression": {
      "type": "string",
      "default": "y=x^2",  // ✅ 典型示例
      "description": "函数表达式"
    },
    "xRange": {
      "type": "array",
      "default": [-10, 10],  // ✅ 合理范围
      "description": "X 轴范围"
    },
    "showGrid": {
      "type": "boolean",
      "default": true,  // ✅ 推荐的默认状态
      "description": "是否显示网格"
    }
  }
}
```

原则：
- default 值应该能展示组件的典型用法
- 数值应该在合理范围内
- 字符串不要为空
- 布尔值选择更有展示效果的状态
```

### 错误 6：a2ui_hint 过于简单

**症状：**
```json
{
  "a2ui_hint": "用于展示分子结构"
}
```

**修正提示词：**
```text
❌ 错误：a2ui_hint 过于简单，LLM 无法理解如何正确使用组件。

a2ui_hint 是 LLM 理解组件的关键，必须包含：
1. 适合什么场景
2. 应该传哪些关键参数
3. 哪些功能已内置，不要重复生成
4. 如果依赖后端，应该先做什么

请改写为：

```json
{
  "a2ui_hint": "适合展示单个分子的三维结构。若需要真实结构数据，应先调用插件后端的 generate_structure 动作（传入 molecule_name），获取原子和化学键数据后，再将数据传给本组件的 atoms 和 bonds 参数。组件内部已支持鼠标拖拽旋转和滚轮缩放，不要在外部重复生成旋转、缩放按钮。适合用于解释分子空间构型、键角、键长等概念。"
}
```

对比：
- ❌ "用于展示分子结构" - 太简单
- ✅ 上面的完整版本 - LLM 能理解完整的使用流程
```

---

## 10. 快速检查清单

在提交插件或向 AI 请求修正前，用这个清单快速检查：

### 前端组件检查

```text
[ ] 组件签名是 ({ node }: { node: A2UINode })
[ ] 从 node.properties 读取参数
[ ] 所有参数都有默认值
[ ] 使用类型安全的参数解析
[ ] 没有引入外部依赖（除非有充分理由）
[ ] 使用 inline style，遵循设计规范
[ ] 组件能响应 props 变化（useEffect）
```

### 后端模块检查（如果有）

```text
[ ] 提供 async def invoke(action, payload, context) -> dict
[ ] 按 action 分发到具体函数
[ ] 返回值可 JSON 序列化
[ ] 对非法 action 抛出 ValueError
[ ] 对可能失败的场景使用 success + error 模式
[ ] 没有定义 FastAPI app 和路由
```

### manifest.json 检查

```text
[ ] id 使用 kebab-case
[ ] component_id 使用 PascalCase
[ ] component_id 与组件导出名完全一致
[ ] sharedDependencies 只包含 react、react-dom、@a2ui/react
[ ] 如果有后端，python_module 路径正确（下划线或连字符）
[ ] 如果有后端，backend.kind 是 "hosted-plugin-service"
[ ] 如果有后端，backend.capabilities 列出所有 actions
[ ] props_schema 的每个参数都有 type、default、description
[ ] default 值是有意义的示例（不是空字符串、0、null）
[ ] a2ui_hint 足够具体，包含使用场景、参数说明、内置功能说明
[ ] 最重要的组件在 capabilities 第一位
```

### 目录结构检查

```text
plugins/your-plugin-id/
├── manifest.json          [ ] 存在且格式正确
├── src/
│   ├── index.ts          [ ] 存在且正确导出
│   └── ComponentName.tsx [ ] 存在且组件名正确
├── backend/              [ ] 如果有后端，目录存在
│   └── __init__.py       [ ] 如果有后端，文件存在且有 invoke 函数
└── dist/                 [ ] 构建后生成
    └── index.esm.js      [ ] 构建产物存在
```

### 验证流程检查

```text
[ ] 后端日志显示 "Loaded plugin 'your-plugin-id'"
[ ] /api/v1/plugins 返回包含你的插件
[ ] 插件 enabled 状态为 true
[ ] 浏览器控制台显示 "[CatalogRegistry] Registered plugin component: YourComponent"
[ ] Gallery (/?gallery=1) 中能看到组件预览
[ ] Gallery 预览效果符合预期
[ ] 在对话中 LLM 能正确调用组件
```

---

## 11. 给 AI 的完整约束总结

当你要求 AI 生成 AhaTutor 插件时，可以直接复制这段约束：

```text
【AhaTutor 插件开发完整约束】

你正在为 AhaTutor 开发插件，这是一个宿主托管的插件系统，不是独立项目。

## 核心原则
1. 插件不是独立应用，是宿主的能力扩展
2. 宿主提供 React、A2UI、FastAPI 平台能力
3. 插件只负责学科专属的组件和计算逻辑
4. 优先减少依赖，优先使用原生 API

## 前端约束
- 组件签名：({ node }: { node: A2UINode })
- 参数来源：node.properties
- 参数解析：类型安全 + 默认值
- 依赖限制：只能用 react、react-dom、@a2ui/react
- 样式方式：inline style
- 设计规范：#faf9f5、#1b1c1a、#182544、#775a19
- 导出方式：src/index.ts 的 export default { components: {...} }

## 后端约束（如果需要）
- 接口签名：async def invoke(action: str, payload: dict, context: dict) -> dict
- 不要生成：FastAPI app、路由、独立服务
- 返回格式：可 JSON 序列化的 dict
- 错误处理：{"success": False, "error": "..."}
- 模块路径：plugins.plugin_id_with_underscores.backend

## manifest.json 约束
- id: kebab-case
- component_id: PascalCase，与导出名一致
- sharedDependencies: ["react", "react-dom", "@a2ui/react"]
- props_schema: 每个参数有 type、default、description
- default 值：必须有意义，用于 Gallery 预览
- a2ui_hint: 必须具体，说明场景、参数、内置功能、后端依赖
- 最重要的组件放 capabilities 第一位

## 验证要求
生成代码后，提供验证清单，包括：
- 文件结构是否完整
- 命名是否一致
- 约束是否都遵循
- 如何在 Gallery 和对话中测试

现在开始生成插件。
```

---

## 12. 总结

这份补充指南提供了：

1. **宿主实际行为的详细说明** - 让开发者和 AI 理解系统真正如何工作
2. **可直接复制的提示词模板** - 减少与 AI 沟通的摩擦
3. **常见错误与修正方案** - 快速定位和解决问题
4. **完整的验证清单** - 确保插件质量

使用建议：

- **开发新插件时**：使用第 8 节的完整提示词模板
- **遇到问题时**：查看第 9 节的常见错误
- **提交前检查**：使用第 10 节的快速清单
- **与 AI 协作时**：复制第 11 节的完整约束

配合《插件开发指南》使用，可以大幅提升 AI 辅助开发的成功率和代码质量。

