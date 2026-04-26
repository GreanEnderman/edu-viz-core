# A2UI 插件 Manifest 生成 Prompt

把下面的模板连同你的 React 组件源码一起交给 AI，用来生成 `manifest.json` 里的 `capabilities` 字段。

## 使用前提

- 插件是宿主平台上的扩展，不是独立前端应用。
- `react`、`react-dom`、`@a2ui/react` 由宿主提供，不要把这些库当成插件私有依赖来描述。
- `manifest.json` 顶层默认应声明：

```json
"sharedDependencies": ["react", "react-dom", "@a2ui/react"]
```

## Prompt

```text
你是 A2UI 插件 manifest 生成器。

背景约束：
1. 这个插件运行在宿主平台提供的共享运行时里，不是独立应用。
2. 宿主已经提供 react、react-dom、@a2ui/react。
3. 你只需要生成 manifest.json 里的 capabilities 数组，不要生成 package.json、构建配置或额外依赖建议。

请根据下面提供的 React 组件源码和用途描述，输出 capabilities 数组。

输入：
1. React 组件源码
2. 组件用途说明

输出要求：
- 直接输出 JSON 数组，不要加 Markdown 代码块。
- 每个 capability 都必须包含以下字段：
  - component_id
  - name
  - tags
  - props_schema
  - a2ui_hint
  - expresses
  - educational_use
  - cannot_express

字段约束：
- component_id:
  - 使用 PascalCase
  - 必须与 React 组件名一致
- name:
  - 用中文简洁描述组件能力
- tags:
  - 3 到 6 个学科或场景关键词
- props_schema:
  - 为每个 prop 提供 type、default、description
  - 数值型 prop 额外补充 min、max（如果能确定）
- a2ui_hint:
  - 明确告诉 LLM 应该如何调用这个组件
  - 如果组件已经内置交互控件，要明确说明“不需要额外生成 Slider/Button/TextField”
  - 如果需要配合 A2UI 标准组件构建外围控制区，也要明确说明绑定关系
- expresses:
  - 列出这个组件适合表达的可视化或交互维度
- educational_use:
  - 用一句话说明教学用途
- cannot_express:
  - 列出不适合用这个组件表达的内容，帮助 LLM 避免误用

额外要求：
- 不要把组件描述成“页面”或“应用”。
- 不要建议插件自己携带 React、ReactDOM、A2UI。
- 优先输出对 LLM 调用最稳定、最不容易误用的描述。
```

## 使用方法

1. 复制上面的 Prompt。
2. 粘贴组件源码和用途说明。
3. 让 AI 生成 `capabilities`。
4. 把结果填回 `manifest.json`。
5. 检查 `component_id` 是否和导出的组件名一致。
