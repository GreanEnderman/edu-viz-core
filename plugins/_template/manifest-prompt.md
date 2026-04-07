# A2UI 插件 Manifest 生成 Prompt

将以下内容连同你的 React 组件源码一起提供给 AI（如 Claude），生成 `manifest.json` 的 `capabilities` 部分。

---

## Prompt

```
你是一个 A2UI 插件 manifest 生成器。根据以下组件源码和描述，生成 manifest.json 中 capabilities 数组的完整内容。

## 输入

### 组件源码
（在此粘贴你的 React 组件 .tsx 文件内容）

### 组件用途描述
（简要描述这个组件的功能、适用学科和教学场景）

## 输出要求

生成一个 JSON 数组，每个元素代表一个 capability，必须包含以下字段：

### component_id
- PascalCase 格式，与 React 组件名完全一致
- 示例："PhysicsOscillator"

### name
- 中文名称，简洁描述组件功能
- 示例："简谐运动模拟器"

### tags
- 学科相关关键词数组（3-6 个）
- 用于意图路由匹配，应包含该组件涉及的学科概念
- 示例：["振动", "简谐运动", "波形"]

### props_schema
- 每个组件 props 的 JSON Schema 描述
- 字段要求：
  - `type`: 数据类型（number / string / boolean）
  - `default`: 默认值
  - `min` / `max`（数值型）：取值范围
  - `description`: 中文说明该参数的物理/教学含义
- 示例：
```json
{
  "amplitude": {
    "type": "number",
    "default": 1,
    "min": 0,
    "max": 10,
    "description": "振幅（m），控制波形的最大偏移量"
  }
}
```

### a2ui_hint
- 给 LLM 的使用指导，说明如何用 A2UI 标准组件构建操控面板
- 必须说明：
  1. 用哪些标准 A2UI 组件（Slider / Button / TextField 等）绑定哪些 props
  2. 建议的布局方式（Row / Column / Card）
  3. 交互说明（用户操作后会发生什么）
- 示例："使用 Slider 组件绑定 amplitude（范围 0~10）和 freq（范围 0.1~5），布局建议上方放组件动画，下方用 Column 排列参数 Slider"

### expresses
- 该组件能表达的可视化/交互维度（3-5 个）
- 示例：["简谐运动波形", "振幅变化", "频率变化"]

### educational_use
- 具体的教学应用场景，一句话描述
- 示例："探索简谐运动参数对波形的影响，直观理解振幅、频率的物理意义"

### cannot_express
- 该组件不适合表达的场景（2-4 个），帮助 LLM 避免误用
- 示例：["多质点系统", "阻尼振动", "共振现象"]

## A2UI 可用标准组件

| 组件名 | 用途 | 主要 Props |
|--------|------|-----------|
| Text | 文本显示 | text, usageHint (h1-h6, body, caption) |
| Image | 图片 | url, alt |
| Button | 按钮 | child, action, primary |
| TextField | 文本输入 | label, text (path 绑定) |
| Slider | 数值滑块 | value (path), minValue, maxValue, action |
| CheckBox | 复选框 | label, value (path) |
| MultipleChoice | 单选/多选 | selections (path), options, type (radio/checkbox) |
| DateTimeInput | 日期选择 | value (path), enableDate, enableTime |
| Row | 水平布局 | children, distribution, alignment |
| Column | 垂直布局 | children, alignment |
| Card | 卡片容器 | child |
| Tabs | 标签页 | tabs (label + content), selected (path) |
| Divider | 分隔线 | 无 |
| Icon | 图标 | name |

## 输出格式

直接输出 JSON 数组，不要包含 markdown 代码块标记：
```

---

## 使用方法

1. 复制上面的 Prompt 模板
2. 将组件源码粘贴到「组件源码」部分
3. 填写「组件用途描述」
4. 发送给 AI，获取 capabilities JSON
5. 将 JSON 粘贴到 `manifest.json` 的 `capabilities` 字段中
6. 检查并微调生成的内容
