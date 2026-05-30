from typing import Type, Literal
from pydantic import BaseModel, Field

from .base import BaseAgent
from .llm_client import LLMClient
from .config import AgentConfig
from ..learning.schemas import LearningNode


class VisualizerAgentInput(BaseModel):
    """可视化决策器输入"""

    current_node: LearningNode = Field(..., description="当前节点")
    tutor_context: str = Field(..., description="Tutor 提供的上下文")
    plugin_capabilities: list[dict] = Field(default_factory=list, description="可用插件能力")
    available_components: list[str] = Field(default_factory=list, description="可用组件列表")


class VisualizerAgentOutput(BaseModel):
    """可视化决策器输出"""

    should_visualize: bool = Field(..., description="是否需要可视化")
    visualization_type: Literal["a2ui", "mermaid", "none"] = Field(..., description="可视化类型")
    component_hints: list[str] = Field(default_factory=list, description="推荐的组件列表")
    visual_goal: str = Field(..., description="可视化目标描述")
    reasoning: str = Field(..., description="决策理由")


class VisualizerAgent(BaseAgent[VisualizerAgentInput, VisualizerAgentOutput]):
    """
    可视化决策 Agent
    决策是否需要可视化，并提供组件提示
    """

    def __init__(self):
        config = AgentConfig(
            temperature=0.4,  # 较低温度，更确定的决策
            max_retries=3,
            max_tokens=1000,
        )
        super().__init__(config)
        self.llm_client = LLMClient(
            max_retries=config.max_retries,
            retry_delay_base=config.retry_delay_base,
        )

    def get_input_schema(self) -> Type[VisualizerAgentInput]:
        return VisualizerAgentInput

    def get_output_schema(self) -> Type[VisualizerAgentOutput]:
        return VisualizerAgentOutput

    def get_system_prompt(self, input_data: VisualizerAgentInput) -> str:
        node = input_data.current_node
        tutor_context = input_data.tutor_context
        available_components = input_data.available_components or [
            "Card", "Text", "Slider", "Button", "Input", "Select"
        ]
        plugin_capabilities = input_data.plugin_capabilities

        # 构建可用组件列表
        components_str = "\n".join(f"   - {c}" for c in available_components)

        # 构建插件能力列表
        if plugin_capabilities:
            plugins_str = "\n".join(
                f"   - {p.get('name', 'Unknown')}: {p.get('description', '')}"
                for p in plugin_capabilities
            )
        else:
            plugins_str = "   - 无可用插件"

        return f"""你是一个可视化决策专家。判断当前教学内容是否需要可视化，以及使用何种方式。

当前节点信息：
- 标题：{node.title}
- 描述：{node.description}
- 难度：{node.estimated_difficulty}
- 组件提示：{', '.join(node.component_hints) if node.component_hints else '无'}

教学上下文：
{tutor_context[:500]}...

当前可用组件：
{components_str}

当前可用插件：
{plugins_str}

决策流程：

1. **判断是否需要可视化**：

   **需要可视化的情况**：
   - 涉及结构关系（如树形结构、网络图）
   - 涉及流程步骤（如算法流程、工作流）
   - 涉及参数变化（如物理模拟、数学函数）
   - 涉及动态演示（如动画、交互）
   - 涉及空间关系（如几何、布局）

   **不需要可视化的情况**：
   - 纯概念定义
   - 纯文字描述
   - 简单列举
   - 抽象理论

2. **判断可视化类型**：

   **a2ui**（交互式组件）：
   - 需要用户交互（调整参数、点击按钮）
   - 需要动态演示（实时更新、动画）
   - 需要数据输入（表单、输入框）
   - 适合探索式学习

   **mermaid**（静态图表）：
   - 静态结构图（流程图、类图）
   - 关系图（思维导图、依赖图）
   - 时序图（交互序列）
   - 不需要交互

   **none**（不可视化）：
   - 无法有效可视化
   - 文字描述更清晰

3. **选择组件**：

   **优先级**：
   1. 插件组件（如 PhysicsOscillator）- 专门为特定领域设计
   2. 基础组件组合（如 Slider + Text + Card）- 灵活组合

   **常见组合**：
   - 参数调整：Slider + Text（显示值）
   - 数据展示：Card + Text
   - 交互控制：Button + Input
   - 选项选择：Select + Text

   **注意**：
   - 确保组件能完整表达概念
   - 不要过度复杂
   - 考虑用户体验

4. **描述可视化目标**：
   - 说明可视化要达到的教学目标
   - 说明用户通过可视化能学到什么
   - 说明如何与教学内容配合

输出要求：

1. **should_visualize**：
   - true: 需要可视化
   - false: 不需要可视化

2. **visualization_type**：
   - "a2ui": 交互式组件
   - "mermaid": 静态图表
   - "none": 不可视化

3. **component_hints**：
   - 组件名称列表
   - 例如：["PhysicsOscillator", "Slider", "Card"]
   - 如果不需要可视化，返回空列表 []

4. **visual_goal**：
   - 可视化目标描述（1-2 句话）
   - 例如："通过交互式模拟器，让学生直观理解振幅、频率、相位对振动的影响。"
   - 如果不需要可视化，说明原因

5. **reasoning**：
   - 决策理由（2-3 句话）
   - 说明为什么做出这个决策

示例输出格式：

**需要可视化的情况**：
{{
  "should_visualize": true,
  "visualization_type": "a2ui",
  "component_hints": ["PhysicsOscillator", "Slider"],
  "visual_goal": "通过交互式模拟器，让学生直观理解振幅、频率、相位对简谐振动的影响，并能实时调整参数观察变化。",
  "reasoning": "简谐振动涉及多个参数的动态变化，纯文字描述难以理解。使用物理模拟器可以让学生通过调整参数，直观观察振动规律。"
}}

**不需要可视化的情况**：
{{
  "should_visualize": false,
  "visualization_type": "none",
  "component_hints": [],
  "visual_goal": "纯概念定义，文字描述更清晰。",
  "reasoning": "当前内容是简谐振动的定义，属于概念理解，不涉及参数变化或动态演示，文字描述已经足够清晰。"
}}

注意事项：
- 不要生成具体的 A2UI JSON
- 只提供组件提示和可视化目标
- 保守决策，避免过度可视化
- 考虑教学效果，不是所有内容都需要可视化
"""

    async def process(self, input_data: VisualizerAgentInput) -> VisualizerAgentOutput:
        """执行可视化决策"""
        system_prompt = self.get_system_prompt(input_data)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "请判断是否需要可视化，并提供组件提示。"},
        ]

        # 调用 LLM 获取结构化输出
        output = await self.llm_client.call_structured(
            messages=messages,
            response_model=VisualizerAgentOutput,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            model_override=self.config.model_override,
        )

        # 验证逻辑一致性
        if not output.should_visualize:
            output.visualization_type = "none"
            output.component_hints = []

        return output
