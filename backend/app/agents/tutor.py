from typing import Type
from pydantic import BaseModel, Field

from .base import BaseAgent
from .llm_client import LLMClient
from .config import AgentConfig
from ..learning.schemas import LearningWorkflowState, LearningNode


class TutorAgentInput(BaseModel):
    """导师 Agent 输入"""

    workflow_state: LearningWorkflowState = Field(..., description="工作流状态")
    current_node: LearningNode = Field(..., description="当前节点")
    user_message: str = Field(..., description="用户消息")
    conversation_history: list[dict] = Field(default_factory=list, description="对话历史")


class TutorAgentOutput(BaseModel):
    """导师 Agent 输出"""

    content: str = Field(..., description="教学内容（支持 Markdown）")
    should_visualize: bool = Field(default=False, description="是否需要可视化")
    visualization_context: dict = Field(default_factory=dict, description="可视化上下文")
    next_action_suggestion: str | None = Field(None, description="下一步建议")


class TutorAgent(BaseAgent[TutorAgentInput, TutorAgentOutput]):
    """
    导师 Agent
    提供个性化教学内容
    """

    def __init__(self):
        config = AgentConfig(
            temperature=0.7,  # 较高温度，更自然的对话
            max_retries=3,
            max_tokens=2000,
        )
        super().__init__(config)
        self.llm_client = LLMClient(
            max_retries=config.max_retries,
            retry_delay_base=config.retry_delay_base,
        )

    def get_input_schema(self) -> Type[TutorAgentInput]:
        return TutorAgentInput

    def get_output_schema(self) -> Type[TutorAgentOutput]:
        return TutorAgentOutput

    def get_system_prompt(self, input_data: TutorAgentInput) -> str:
        node = input_data.current_node
        goal = input_data.workflow_state.goal
        state = input_data.workflow_state

        mastery_criteria_str = "\n".join(f"   - {c}" for c in node.mastery_criteria)

        # 构建学习进度信息
        total_nodes = len(state.knowledge_tree)
        mastered_count = len(state.mastered_node_ids)
        progress_pct = (mastered_count / total_nodes * 100) if total_nodes > 0 else 0

        return f"""你是一个耐心、专业的导师。根据学习状态和用户消息，提供个性化教学。

当前学习状态：
- 项目目标：{goal.title}
- 项目类型：{goal.artifact_type}
- 领域：{', '.join(goal.domains)}
- 难度：{goal.difficulty}
- 学习进度：{mastered_count}/{total_nodes} 节点已掌握 ({progress_pct:.1f}%)
- 当前模式：{state.current_mode}

当前节点信息：
- 标题：{node.title}
- 描述：{node.description}
- 掌握标准：
{mastery_criteria_str}
- 项目关联：{node.project_relevance}
- 难度：{node.estimated_difficulty}
- 状态：{node.status}

教学原则：

1. **循序渐进**：
   - 从简单到复杂
   - 从具体到抽象
   - 从例子到原理
   - 根据节点难度调整讲解深度

2. **互动引导**：
   - 多提问，少灌输
   - 鼓励学生思考
   - 及时给予反馈
   - 使用苏格拉底式提问法

3. **项目导向**：
   - 始终关联项目目标：{goal.title}
   - 强调知识的实际应用
   - 激发学习动机
   - 说明当前知识如何用于项目

4. **可视化决策**：
   - 如果概念适合可视化（涉及结构、流程、参数变化、动态演示），设置 should_visualize=true
   - 在 visualization_context 中提供必要信息：
     * concept: 需要可视化的概念
     * reason: 为什么需要可视化
     * suggested_components: 建议的组件（如 "PhysicsOscillator", "Slider", "Card"）
   - 但不要直接生成 A2UI JSON（由 VisualizerAgent 负责）

5. **个性化教学**：
   - 根据节点状态调整策略：
     * unknown: 从零开始，详细讲解基础
     * learning: 巩固理解，提供更多例子
     * review: 针对薄弱点，重点突破
     * mastered: 简要回顾，引导深入
   - 根据用户问题类型调整：
     * 概念理解：解释原理，举例说明
     * 应用问题：提供步骤，引导实践
     * 困惑疑问：耐心解答，换个角度

6. **下一步建议**：
   - 如果用户已经理解当前内容，建议进行测评
   - 如果用户需要更多练习，建议具体的练习方向
   - 如果用户准备好了，建议进入下一个节点

输出要求：

1. **content**：
   - 使用 Markdown 格式
   - 结构清晰，分段合理
   - 包含具体例子
   - 语言通俗易懂
   - 长度适中（不要过长）

2. **should_visualize**：
   - true: 如果概念适合可视化
   - false: 如果纯文字讲解更合适

3. **visualization_context**：
   - 如果 should_visualize=true，提供：
     * concept: 概念名称
     * reason: 可视化原因
     * suggested_components: 建议的组件列表

4. **next_action_suggestion**：
   - 简短的下一步建议（1-2 句话）
   - 例如："你已经理解了基础概念，可以尝试做一下测评题来检验掌握程度。"

示例输出格式：
{{
  "content": "## 简谐振动的三要素\\n\\n简谐振动有三个关键要素：振幅、频率和相位。让我们逐一理解：\\n\\n### 1. 振幅（A）\\n振幅是物体离开平衡位置的最大距离...",
  "should_visualize": true,
  "visualization_context": {{
    "concept": "简谐振动",
    "reason": "通过动态演示可以直观理解振幅、频率、相位的影响",
    "suggested_components": ["PhysicsOscillator", "Slider"]
  }},
  "next_action_suggestion": "理解了三要素后，建议通过交互式模拟器调整参数，观察振动变化。"
}}

注意事项：
- 不要直接告诉答案，引导学生思考
- 不要使用过于专业的术语，除非必要
- 不要一次讲太多，保持节奏
- 不要忽视学生的困惑，耐心解答
"""

    async def process(self, input_data: TutorAgentInput) -> TutorAgentOutput:
        """执行教学"""
        system_prompt = self.get_system_prompt(input_data)

        # 构建消息历史
        messages = [{"role": "system", "content": system_prompt}]

        # 添加对话历史（如果有）
        if input_data.conversation_history:
            messages.extend(input_data.conversation_history[-5:])  # 只保留最近 5 轮对话

        # 添加当前用户消息
        messages.append({"role": "user", "content": input_data.user_message})

        # 调用 LLM 获取结构化输出
        output = await self.llm_client.call_structured(
            messages=messages,
            response_model=TutorAgentOutput,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            model_override=self.config.model_override,
        )

        return output
