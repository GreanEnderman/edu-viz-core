_A2UI_OUTPUT_RULES = """\
你可以在回答中嵌入 A2UI v0.8 JSONL 消息来渲染交互式组件。

## A2UI 输出规则
- 每条 A2UI 消息必须独占一行，格式为合法 JSON 对象。
- 不要将 A2UI 消息放在代码块（```）内。
- 消息顺序必须为：surfaceUpdate → dataModelUpdate → beginRendering。
- 普通文本直接输出，无需任何特殊格式。
- **重要**：生成插件组件时，只需通过 properties 传入初始数值（纯数字），不要为插件组件的参数额外创建 Slider、TextField 等控件。许多插件组件已内置参数控制。
"""

_MERMAID_RULES = """\
## Mermaid 图表规则
你可以在回答中使用 mermaid 代码块来渲染流程图。
**必须使用标准语法**：
- 箭头必须用双横线 `-->`，不要用单横线 `->`
- 带标签的箭头用 `-- 标签 -->` 或 `-->|标签|`，不要用 `- 标签 ->`

正确示例：
```mermaid
graph TD
    A[开始] --> B{是否有任务?}
    B -- 是 --> C[执行任务]
    C --> D[完成任务]
    B -- 否 --> E[等待]
    D --> F[结束]
    E --> F
```

错误示例（会导致渲染失败）：
```mermaid
graph TD
    A[开始] -> B{是否有任务?}
    B - 是 -> C[执行任务]
```
"""

_COMPONENT_EXAMPLES = """\
## 消息格式（v0.8）

每条消息是一个 JSON 对象，**消息类型是顶层键**（不是 "type" 字段）：

### 1. surfaceUpdate — 定义组件树
```json
{"surfaceUpdate": {"surfaceId": "main", "components": [...]}}
```
components 数组中每个元素格式：
```json
{"id": "唯一ID", "component": {"组件类型": {属性}}}
```

### 2. dataModelUpdate — 设置数据（用 contents 数组）
```json
{"dataModelUpdate": {"surfaceId": "main", "contents": [{"key": "keyName", "valueNumber": 50}]}}
```

### 3. beginRendering — 触发渲染（必须指定 root）
```json
{"beginRendering": {"surfaceId": "main", "root": "根组件ID"}}
```

## 组件示例

### Button（需要一个子组件作为内容）
```json
{"id": "btn_label", "component": {"Text": {"text": {"literalString": "点击我"}}}}
{"id": "btn", "component": {"Button": {"child": "btn_label", "action": {"name": "click", "context": []}}}}
```

### Text
```json
{"id": "t1", "component": {"Text": {"text": {"literalString": "正文内容"}, "usageHint": "body"}}}
```
usageHint 可选值：h1, h2, h3, h4, h5, body, caption

### Slider
```json
{"id": "slider1", "component": {"Slider": {"value": {"path": "/val"}, "minValue": 0, "maxValue": 100}}}
```

### TextField
```json
{"id": "input1", "component": {"TextField": {"label": {"literalString": "请输入"}, "text": {"path": "/input_val"}}}}
```

### CheckBox
```json
{"id": "cb1", "component": {"Checkbox": {"label": {"literalString": "同意"}, "value": {"path": "/agree"}}}}
```

### Column / Row（布局容器）
```json
{"id": "col", "component": {"Column": {"children": {"explicitList": ["child1", "child2"]}, "alignment": "center"}}}
```

### Card
```json
{"id": "card", "component": {"Card": {"child": "card_content_id"}}}
```

## 完整示例：输出一个带按钮的卡片

按行输出（每行一个 JSON）：
```json
{"surfaceUpdate": {"surfaceId": "main", "components": [{"id": "title", "component": {"Text": {"text": {"literalString": "你好！"}, "usageHint": "h2"}}}, {"id": "desc", "component": {"Text": {"text": {"literalString": "这是一个示例卡片"}}}}, {"id": "btn_txt", "component": {"Text": {"text": {"literalString": "了解更多"}}}}, {"id": "btn", "component": {"Button": {"child": "btn_txt", "action": {"name": "learn_more", "context": []}}}}, {"id": "card_col", "component": {"Column": {"children": {"explicitList": ["title", "desc", "btn"]}, "alignment": "center"}}}, {"id": "root", "component": {"Card": {"child": "card_col"}}}]}}
{"beginRendering": {"surfaceId": "main", "root": "root"}}
```
"""

_VISUALIZATION_DECISION_RULES = """\
## 可视化决策规则

回答需要可视化时，按以下顺序决策：

### 步骤 1：判断是否需要可视化
- 纯文字概念（定义、语法、历史叙述）→ 仅文本
- 涉及结构、流程、数量、关系 → 进入步骤 2

### 步骤 2：判断是否需要交互
需要交互的情况：
- 学生需要探索参数变化的影响（如：振幅如何影响波形）
- 存在"如果...会怎样"的探索场景
- 需要测验/练习让学生主动参与
→ 使用 A2UI 组件

不需要交互的情况：
- 仅需展示静态结构或层次关系
- 流程/步骤的逻辑关系
- 概念间的分类关系
→ 使用 Mermaid 图表

### 步骤 3：判断组件能否完整表达
对照下方「组件能力表」，检查：
- 概念的每个可视化维度是否有对应组件可表达？
- 组件组合后是否能形成完整的交互模型？

能完整表达 → 纯 A2UI
部分表达 → 混合方案（A2UI 做交互部分 + Mermaid 做结构部分）
无法表达 → 降级为 Mermaid 或纯文本

### 优先级原则
在同样能表达的情况下：A2UI 交互组件 > Mermaid 图表 > 纯文本
交互式体验对学习效果更好，应优先选择。
"""

_COMPONENT_CAPABILITY_TABLE = """\
## 组件能力表

### 内容组件
| 组件 | 能表达 | 不能表达 |
|------|--------|----------|
| Text | 标题、正文、标签、公式文本、定义、解释 | 动态数据、空间关系、交互状态 |
| Image | 图示、照片、示意图（静态图表） | 交互操作、动态变化 |
| Icon | 状态指示、操作提示 | 复杂信息 |
| Divider | 视觉分隔 | 数据、关系 |
| Video | 演示录像 | 用户控制参数、实时交互 |
| AudioPlayer | 声音演示 | 视觉信息 |

### 布局组件
| 组件 | 能表达 | 不能表达 |
|------|--------|----------|
| Row | 水平并排、对比 | 层次关系 |
| Column | 垂直堆叠、顺序 | 并行对比 |
| List | 重复结构的项目列表 | 项目间关系 |
| Card | 分组内容、独立区块 | 流向、连接 |
| Tabs | 同一主题的多个视角 | 并发可见性 |
| Modal | 聚焦注意、确认、详情 | 持续可见性 |

### 交互组件
| 组件 | 能表达 | 教育用途 | 不能表达 |
|------|--------|----------|----------|
| Button | 动作、选择、导航 | 提交答案、触发操作 | 连续值、状态 |
| TextField | 文本输入、简答 | 学生输入答案 | 选择项、数值范围 |
| CheckBox | 布尔开关、多选 | 多项选择判断 | 单选、定量值 |
| Slider | 连续数值范围、参数 | 探索参数影响 | 文本、分类 |
| MultipleChoice | 单选/多选、测验 | 知识检测、选项判断 | 自由输入、连续值 |
| DateTimeInput | 日期时间 | 时间相关计算 | 其他数据类型 |

### 插件组件（当前可用）
{plugin_components_section}
"""

# 与 vendor/A2UI-main/renderers/react/src/registry/defaultCatalog.ts 保持同步
_DEFAULT_COMPONENTS = [
    # 内容
    "Text", "Image", "Icon", "Divider", "Video", "AudioPlayer",
    # 布局
    "Row", "Column", "List", "Card", "Tabs", "Modal",
    # 交互
    "Button", "TextField", "CheckBox", "Slider", "DateTimeInput", "MultipleChoice",
]


def _build_plugin_section(plugin_capabilities: list[dict] | None) -> str:
    """Build the plugin components section for the capability table."""
    if not plugin_capabilities:
        return "（当前无插件组件）"
    lines = ["| 组件 | 能表达 | 教育用途 | 不能表达 |"]
    lines.append("|------|--------|----------|----------|")
    for cap in plugin_capabilities:
        expresses = "、".join(cap.get("expresses", []))
        cannot = "、".join(cap.get("cannot_express", []))
        edu = cap.get("educational_use", "")
        lines.append(f"| {cap['component_id']} | {expresses} | {edu} | {cannot} |")

    # Per-component props_schema and a2ui_hint details
    lines.append("")
    for cap in plugin_capabilities:
        lines.append(f"#### {cap['component_id']} 使用说明")
        props = cap.get("props_schema", {})
        if props:
            lines.append("Props 参数：")
            for field, schema in props.items():
                desc = f"  - `{field}` — 类型: {schema.get('type', '?')}"
                if "default" in schema:
                    desc += f"，默认: {schema['default']}"
                if "min" in schema:
                    desc += f"，范围: {schema['min']}~{schema.get('max', '?')}"
                lines.append(desc)
        hint = cap.get("a2ui_hint", "")
        if hint:
            lines.append(f"使用提示：{hint}")
        lines.append("")
    return "\n".join(lines)


async def get_plugin_capabilities_for_user(user_id: str) -> list[dict]:
    """Fetch enabled plugin capabilities for a user from DB + registry."""
    from backend.app.db import get_db
    from backend.app.plugins_manager.registry import PluginRegistry

    db = get_db()
    rows = await db.execute_fetchall(
        "SELECT plugin_id FROM plugin_user_settings WHERE user_id = ? AND enabled = 1",
        (user_id,),
    )
    enabled_ids = [dict(r)["plugin_id"] for r in rows]
    return PluginRegistry.get_instance().get_enabled_capabilities(enabled_ids)


def build_system_prompt(
    available_components: list[str] | None = None,
    plugin_capabilities: list[dict] | None = None,
) -> str:
    if available_components is None:
        available_components = _DEFAULT_COMPONENTS

    plugin_section = _build_plugin_section(plugin_capabilities)
    capability_table = _COMPONENT_CAPABILITY_TABLE.replace(
        "{plugin_components_section}", plugin_section
    )

    plugin_runtime_rules = """\
## Plugin Runtime Rules
- Treat plugin components as host platform extensions, not standalone apps.
- The host provides react, react-dom, and @a2ui/react as shared runtime dependencies.
- Do not describe plugin components as if they own their own app shell, routing, or dependency runtime.
- When plugin capabilities mention built-in controls, prefer passing initial properties only and avoid generating duplicate A2UI controls around them.
"""

    parts = [
        _A2UI_OUTPUT_RULES,
        _MERMAID_RULES,
        _VISUALIZATION_DECISION_RULES,
        plugin_runtime_rules,
        capability_table,
        f"\n可用组件：{', '.join(available_components)}\n",
        _COMPONENT_EXAMPLES,
    ]
    return "\n".join(parts)
